/**
 * Dom.js
 * A robust utility for creating and manipulating DOM elements programmatically.
 */
export const Dom = {
    /**
     * Creates an HTMLElement with the specified tag, attributes, and children.
     * * @param {string} tag - The HTML tag name (e.g., 'div', 'button', 'input').
     * @param {Object} [attributes={}] - Key-value pairs for attributes, properties, or events.
     * @param {Array|HTMLElement|string} [children=[]] - Child nodes to append.
     * @returns {HTMLElement} The constructed element.
     */
    create(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);

        // Process Attributes
        if (attributes) {
            for (const [key, value] of Object.entries(attributes)) {
                // Skip null/undefined values
                if (value === null || value === undefined) continue;

                if (key.startsWith('on') && typeof value === 'function') {
                    // Event Listeners (e.g., onClick -> click)
                    const eventName = key.substring(2).toLowerCase();
                    element.addEventListener(eventName, value);
                } else if (key === 'className' || key === 'class') {
                    // Class names
                    element.className = value;
                } else if (key === 'style' && typeof value === 'object') {
                    // Inline styles object
                    Object.assign(element.style, value);
                } else if (key === 'dataset' && typeof value === 'object') {
                    // Data attributes
                    Object.assign(element.dataset, value);
                } else if (['value', 'checked', 'disabled', 'selected', 'placeholder', 'id', 'type', 'htmlFor'].includes(key)) {
                    // Direct property setting for Form elements ensures UI updates correctly
                    // 'htmlFor' is special case for 'for' attribute in JS
                    element[key] = value;
                } else if (key === 'text') {
                    // Text Content Shortcut
                    element.textContent = value;
                } else if (key === 'html') {
                    // Inner HTML Shortcut
                    element.innerHTML = value;
                } else {
                    // Standard Attribute fallback
                    element.setAttribute(key, String(value));
                }
            }
        }

        // Process Children
        if (children) {
            const childArray = Array.isArray(children) ? children : [children];
            for (const child of childArray) {
                if (child instanceof Node) {
                    element.appendChild(child);
                } else if (child !== null && child !== undefined && child !== false) {
                    element.appendChild(document.createTextNode(String(child)));
                }
            }
        }

        return element;
    },

    /**
     * Removes all child nodes from an element.
     * @param {HTMLElement} element 
     */
    clear(element) {
        if (!element) return;
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },

    /**
     * Mounts an element to a target in the DOM.
     * @param {HTMLElement} element - The element to mount.
     * @param {HTMLElement|string} target - The parent element or its ID.
     */
    mount(element, target) {
        const parent = typeof target === 'string' ? document.getElementById(target) : target;
        if (parent) {
            parent.appendChild(element);
        } else {
            console.error(`Dom.mount: Target '${target}' not found.`);
        }
    }
};