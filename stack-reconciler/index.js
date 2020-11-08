function render(element, container) {
  if (container.firstChild) {
    const prevNode = container.firstChild;
    const prevRootComponent = prevNode._internalInstance;
    const prevElement = prevRootComponent.currentElement;

    if (prevElement.type === element.type) {
      prevRootComponent.receive(element);
      return;
    }

    unmountComponentAtNode(container);
  }
  const rootComponent = instantiateComponent(element);
  const node = rootComponent.mount();
  container.appendChild(node);
  node._internalInstance = rootComponent;

  return rootComponent.getPubicInstance();
}

function unmountComponentAtNode(container) {
  const node = container.firstChild;
  if (node) {
    const rootComponent = node._internalInstance;
    if (rootComponent) {
      rootComponent.unmount();
      container.innerHTML = "";
    }
  }
}

// 返回内部实例
function instantiateComponent(element) {
  if (typeof element === "string") {
    return new TextNode(element);
  } else {
    const { type } = element;
    if (typeof type === "function") {
      return new CompositeComponent(element);
    } else if (typeof type === "string") {
      return new HostComponent(element);
    }
  }
}

class TextNode {
  constructor(element) {
    this.currentElement = element;
    this.node = null;
  }
  getPublicInstance() {
    return this.node;
  }
  receive(element) {
    this.currentElement = element;
    this.node.data = this.currentElement;
  }

  mount() {
    this.node = document.createTextNode(this.currentElement);
    return this.node;
  }

  unmount() {}
}

/**
 *
 * @param {function} type
 * @returns {boolean}
 */
function isClass(type) {
  return Boolean(type.prototype) && Boolean(type.prototype.isReactComponent);
}

class CompositeComponent {
  constructor(element) {
    this.currentElement = element;
    this.renderedComponent = null;
    this.publicInstance = null;
  }

  // 返回公共实例
  getPubicInstance() {
    return this.publicInstance;
  }

  // 返回DOM节点
  getHostNode() {
    return this.renderedComponent.getHostNode();
  }

  receive(nextElement) {
    // 更新当前实例
    const prevElement = this.currentElement;
    const publicInstance = this.publicInstance;
    const prevRenderedComponent = this.renderedComponent;
    const prevRenderedElement = prevRenderedComponent.currentElement;

    const { type, props } = nextElement;
    let nextRenderedElement;
    if (isClass(type)) {
      publicInstance.props = props;
      nextRenderedElement = publicInstance.render();
    } else {
      nextRenderedElement = type(props);
    }
    this.currentElement = nextElement;
    // 更新子实例组件
    if (prevRenderedElement.type === nextRenderedElement.type) {
      // 类型相同，递归更新
      prevRenderedComponent.receive(nextRenderedElement);
    } else {
      // 类型不同，删除卸载原有组件实例，挂载新组件实例
      const prevNode = prevRenderedComponent.getHostNode();
      prevRenderedComponent.unmount();

      const nextRenderedComponent = instantiateComponent(nextRenderedElement);
      const nextNode = nextRenderedComponent.mount();
      this.renderedComponent = nextRenderedComponent;

      prevNode.parentNode.replaceChild(nextNode, prevNode);
    }
  }

  // 返回挂载节点
  mount() {
    const { type, props } = this.currentElement;
    let publicInstance = null;
    let renderedElement = null;
    if (isClass(type)) {
      // 类组件
      publicInstance = new type(props);
      publicInstance.props = props;
      renderedElement = publicInstance.render();
    } else {
      // 函数组件
      publicInstance = null;
      renderedElement = type(props);
    }

    this.publicInstance = publicInstance;
    this.renderedComponent = instantiateComponent(renderedElement);
    return this.renderedComponent.mount();
  }

  unmount() {
    this.renderedComponent.unmount();
  }
}

class HostComponent {
  constructor(element) {
    this.currentElement = element;
    this.node = null;
    this.renderedChildren = [];
  }

  getPubicInstance() {
    return this.node;
  }

  getHostNode() {
    return this.node;
  }

  receive(nextElement) {
    // 更新当前实例
    const node = this.node;
    const prevElement = this.currentElement;
    this.currentElement = nextElement;
    const prevProps = prevElement.props;
    const nextProps = nextElement.props;

    Object.keys(prevProps).forEach((name) => {
      if (name !== "children" && !nextProps.hasOwnProperty(name)) {
        node.removeAttribute(name);
      }
    });

    Object.keys(nextProps).forEach((name) => {
      if (name !== "children") {
        node.setAttribute(name, nextProps[name]);
      }
    });
    // 更新子实例
    let prevChildren = prevProps.children || [];
    let nextChildren = nextProps.children || [];

    if (!Array.isArray(prevChildren)) {
      prevChildren = [prevChildren];
    }

    if (!Array.isArray(nextChildren)) {
      nextChildren = [nextChildren];
    }

    const prevRenderedChildren = this.renderedChildren;
    const nextRenderedChildren = [];

    const operationQueue = [];

    for (let i = 0, len = nextChildren.length; i < len; i++) {
      const prevChild = prevRenderedChildren[i];

      // 没有找到对应的实例，添加新实例
      if (!prevChild) {
        const nextChild = instantiateComponent(nextChildren[i]);
        const node = nextChild.mount();
        nextRenderedChildren.push(nextChild);
        operationQueue.push({ type: "ADD", node });
        continue;
      }

      // 类型不同，移除并重建
      if (prevChildren[i].type !== nextChildren[i].type) {
        const prevNode = prevChild.getHostNode();
        prevChild.unmount();

        const nextChild = instantiateComponent(nextChildren[i]);
        const nextNode = nextChild.mount();
        nextRenderedChildren.push(nextChild);
        operationQueue.push({ type: "REPLACE", prevNode, nextNode });
        continue;
      }

      // 类型相同，更新实例
      prevChild.receive(nextChildren[i]);
      nextRenderedChildren.push(prevChild);
    }

    for (let j = nextChildren.length; j < prevChildren.length; j++) {
      const prevChild = prevRenderedChildren[j];
      const node = prevChild.getHostNode();
      prevChild.unmount();
      operationQueue.push({ type: "REMOVE", node });
    }
    this.renderedChildren = nextRenderedChildren;

    while (operationQueue.length) {
      const operation = operationQueue.shift();

      switch (operation.type) {
        case "ADD":
          this.node.appendChild(operation.node);
          break;
        case "REPLACE":
          this.node.replaceChild(operation.nextNode, operation.prevNode);
          break;
        case "REMOVE":
          this.node.removeChild(operation.node);
          break;
        default:
          break;
      }
    }
  }

  mount() {
    const type = this.currentElement.type;
    let { children = [], ...props } = this.currentElement.props;

    if (!Array.isArray(children)) {
      children = [children];
    }

    // 清除null/undefined/0
    children = children.filter(Boolean);

    const node = document.createElement(type);
    Object.keys(props).forEach((key) => {
      node[key] = props[key];
    });

    const renderedChildren = children.map(instantiateComponent);
    renderedChildren.forEach((child) => {
      node.appendChild(child.mount());
    });

    this.node = node;
    this.renderedChildren = renderedChildren;

    return node;
  }

  unmount() {
    this.renderedChildren.forEach((child) => child.unmount());
  }
}

export { render };
