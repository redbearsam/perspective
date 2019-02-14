//import jsdom from "jsdom";
global.CustomEvent = () => {};

global.customElements = {define: () => {}};
global.HTMLElement = class {
    getAttribute() {}
    hasAttribute() {}
    removeAttribute() {}
    setAttribute() {}
};

export const empty = () => {
    // empty function that can be called to overcome the defined but never used git hook
};
