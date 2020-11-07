function render(element, container) {
  const rootComponent = instantiateComponent(element);
  container.appendChild(rootComponent.mount());
  return rootComponent.getPubicInstance();
}

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

  mount() {
    this.node = document.createTextNode(this.currentElement);
    return this.node;
  }
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
    this.renderedElement = null;
    this.publicInstance = null;
  }

  getPubicInstance() {
    return this.publicInstance;
  }

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
      renderedElement = type(props);
    }

    this.publicInstance = this.publicInstance;
    this.renderedElement = instantiateComponent(renderedElement);

    return this.renderedElement.mount();
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
}

export { render };
