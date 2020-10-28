const isProperty = (prop) => prop !== "children";

const SimactDOM = {
  render(element, container) {
    const { type, props } = element;
    const dom =
      type === "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(type);

    Object.keys(props).forEach((name) => {
      if (isProperty(name)) {
        dom[name] = props[name];
      }
    });

    props.children.filter(Boolean).forEach((child) => this.render(child, dom));

    container.appendChild(dom);
  },
};

export { SimactDOM as default };
