import { isString } from "./helpers.js";
import { isArray } from "./helpers.js";
import { Factory } from "./Factory.js";

export class Element {
    constructor(tag) {
        if (!isString(tag)) {
            throw new TypeError(`${tag} is not a string`);
        }
        this.element = document.createElement(tag);
    }

    classList(classNames) {
        if (typeof classNames === "string") {
            this.element.classList.add(classNames);
        } else if (isArray(classNames)) {
            classNames.forEach((className) => {
                if (isString(className)) {
                    this.element.classList.add(className);
                }
            });
        } else {
            throw new TypeError(`${classNames} is neither an array or a string`);
        }
        return this;
    }

    innerHTML(html) {
        if(!isString(html)) {
            throw new TypeError(`${html} is not a string`);
        }
        this.element.innerHTML = html;
        return this;
    }

    click( clickFunc ) {
        if(typeof clickFunc === 'function') {
            this.element.addEventListener('click', clickFunc)
        }
        return this;
    }
    input(inputFunc) {
        if(typeof inputFunc === 'function') {
            this.element.addEventListener('input', inputFunc)
        }
        return this
    }
    children( children ) {
        if(Array.isArray(children)) {
            children.forEach((child) => {
                if(child instanceof HTMLElement) {
                    this.element.appendChild(child);
                } else if (child instanceof Element) {
                    this.element.appendChild( Factory.getDomElement(child));
                }
            });
        } else {
            if(children instanceof HTMLElement) {
                this.element.appendChild(children)
            } else if (children instanceof HTMLElement) {
                this.element.appendChild( Factory.getDomElement(children));
            }
        }
        return this;
    }

    setAttributes(attrs) {
        try {
            for(const [attr, value] of Object.entries(attrs)) {
                this.element.setAttribute(attr, value);
            }
        } catch (e) {
            console.error(e);
        }
        return this;
    }

    id(tagId) {
        if(typeof tagId === 'string' ) {
            this.element.setAttribute('id', tagId);
        }
        return this
    }

    addEventHandlers( events ) {
        try {
            for( const [event, handler] of Object.entries(events) ) {
                this.element.addEventListener(event, handler);
            }
        } catch (e) {
            console.log(e)
        }
        return this;
    }
}

export function createElement(tag) {
    return new Element(tag);
}
