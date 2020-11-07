function mount(element) {
  if (typeof element === "string") {
    return mountTextNode(element);
  }

  const { type } = element;
  if (typeof type === "function") {
    // 自定义组件
    return mountComposite(element);
  } else if (typeof type === "string") {
    // 宿主元素
    return mountHost(element);
  }
}

function mountTextNode(text) {
  return document.createTextNode(text);
}

/**
 *
 * @param {function} type
 * @returns {boolean}
 */
function isClass(type) {
  return Boolean(type.prototype) && Boolean(type.prototype.isReactComponent);
}

/**
 *
 * @param {function} element
 * @returns {HTMLElement}
 */
function mountComposite(element) {
  const { type, props } = element;
  let renderedElement;
  if (isClass(type)) {
    // 类组件
    const publicInstance = new type(props);
    publicInstance.props = props;
    renderedElement = publicInstance.render();
  } else {
    // 函数组件
    renderedElement = type(props);
  }

  return mount(renderedElement);
}

function mountHost(element) {
  const type = element.type;
  let { children = [], ...props } = element.props;

  console.log(element);
  if (!Array.isArray(children)) {
    children = [children];
  }

  // 清除null/undefined/0
  children = children.filter(Boolean);

  const node = document.createElement(type);
  Object.keys(props).forEach((key) => {
    node[key] = props[key];
  });
  children.forEach((child) => {
    node.appendChild(mount(child));
  });

  return node;
}

export { mount };
