const Simact = {
  createElement(type, config, ...children) {
    let key = null;
    let ref = null;
    let props = {};

    if (config) {
      for (const name in config) {
        if (Object.prototype.hasOwnProperty.call(config, name)) {
          if (name === "key") {
            key = config[name];
          } else if (name === "ref") {
            ref = config[name];
          } else {
            props[name] = config[name];
          }
        }
      }
    }

    props.children = children.map((child) =>
      typeof child === "object"
        ? child
        : {
            type: "TEXT_ELEMENT",
            props: {
              nodeValue: child,
              children: [],
            },
          }
    );

    return {
      type,
      key,
      ref,
      props,
    };
  },
};

export { Simact as default };
