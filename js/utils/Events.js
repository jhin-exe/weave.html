/**
 * Events.js
 * A singleton Event Bus implementation for decoupling architecture.
 * Allows components to communicate without direct dependencies.
 */
class EventManager {
    constructor() {
        this.listeners = new Map();
        // Debug mode can be toggled to trace event flow
        this.debug = false; 
    }

    /**
     * Subscribe to an event.
     * @param {string} eventName - Name of the event to listen for.
     * @param {Function} callback - Function to execute when event triggers.
     * @returns {Function} Unsubscribe function for cleanup.
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);

        // Return a cleanup function for React-like hooks or easy teardown
        return () => this.off(eventName, callback);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} eventName 
     * @param {Function} callback 
     */
    off(eventName, callback) {
        if (this.listeners.has(eventName)) {
            const set = this.listeners.get(eventName);
            set.delete(callback);
            if (set.size === 0) {
                this.listeners.delete(eventName);
            }
        }
    }

    /**
     * Publish an event to all subscribers.
     * @param {string} eventName 
     * @param {*} payload - Data to pass to listeners.
     */
    emit(eventName, payload) {
        if (this.debug) {
            console.log(`[Event] ${eventName}`, payload);
        }

        if (this.listeners.has(eventName)) {
            const callbacks = this.listeners.get(eventName);
            callbacks.forEach(cb => {
                try {
                    cb(payload);
                } catch (err) {
                    console.error(`Error in event listener for "${eventName}":`, err);
                }
            });
        }
    }

    /**
     * Clears all listeners. Useful for full app resets.
     */
    clearAll() {
        this.listeners.clear();
    }
}

// Export a single instance to ensure one central bus for the app
export const Events = new EventManager();