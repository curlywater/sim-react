const isProperty = (prop) => prop !== "children";
const isEvent = (prop) => prop.startsWith("on");
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (_prev, next) => (key) => !key in next;

let nextOfUnitWork = null;
let workInProgressRoot = null;
let currentRoot = null;
let deletions = null;

function createDOM(fiber) {
  const { type, props } = fiber;
  const dom =
    type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(type);

  updateDOM(dom, {}, props);
  return dom;
}

function updateDOM(dom, prevProps, nextProps) {
  Object.keys(prevProps).forEach((name) => {
    if (isEvent(name) && (!(name in prevProps) || isNew(name))) {
      dom.removeEventListener(name.toLowerCase().substring(2), prevProps[name]);
    }
    if (isProperty(name) && isGone(name)) {
      dom[name] = "";
    }
  });

  Object.keys(nextProps).forEach((name) => {
    if (isEvent(name) && isNew(name)) {
      dom.addEventListener(name.toLowerCase().substring(2), nextProps[name]);
    }
    if (isProperty(name) && isNew(name)) {
      dom[name] = nextProps[name];
    }
  });
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(workInProgressRoot.child);
  currentRoot = workInProgressRoot;
  workInProgressRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  let parentFiber = fiber.parent;
  while (parentFiber.dom === null) {
    parentFiber = parentFiber.parent;
  }
  const domParent = parentFiber.dom;

  if (fiber.effectTag === "DELETION") {
    commitDeletion(domParent, fiber);
    domParent.removeChild(fiber.dom);
  } else if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDOM(fiber.dom, fiber.props, fiber.alternate.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(domParent, fiber) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(domParent, fiber.child);
  }
}

const SimactDOM = {
  render(element, container) {
    deletions = [];
    workInProgressRoot = {
      dom: container,
      props: {
        children: [element],
      },
      alternate: currentRoot,
    };

    nextOfUnitWork = workInProgressRoot;
  },
};

function workLoop(deadline) {
  let shouldYield = false;

  while (nextOfUnitWork && !shouldYield) {
    nextOfUnitWork = performUnitOfWork(nextOfUnitWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (workInProgressRoot && !nextOfUnitWork) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  // create dom
  if (!fiber.dom) {
    fiber.dom = createDOM(fiber);
  }

  reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(fiber, elements) {
  // create children fibers
  let oldFiber = fiber.alternate && fiber.alternate.child;
  let index = 0;
  let prevSibling = null;

  while (index < elements.length || oldFiber) {
    let newFiber = null;
    const element = elements[index];
    const isSameType = element && oldFiber && element.type === oldFiber.type;

    if (isSameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: fiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    if (element && !isSameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: fiber,
        alternate: oldFiber,
        effectTag: "PLACEMENT",
      };
    }

    if (oldFiber && !isSameType) {
      deletions.push(oldFiber);
      oldFiber.effectTag = "DELETION";
    }

    if (index === 0) {
      fiber.child = newFiber;
    }
    if (prevSibling) {
      prevSibling.sibling = newFiber;
    }
    index++;
    prevSibling = newFiber;

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
  }
}

function performUnitOfWork(fiber) {
  if (fiber.type instanceof Function) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // return next unitOfWork
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

export { SimactDOM as default };
