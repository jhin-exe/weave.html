import { Dom } from '../../utils/Dom.js';
import { Events } from '../../utils/Events.js';

/**
 * TabManager.js
 * Controls the visibility of different editor views (Scenes, Map, Logic).
 * It creates the tab buttons and manages the "active" state of content containers.
 */
export const TabManager = {
    activeTab: 'scenes',
    containers: {}, // Stores references to content DIVs

    /**
     * Initialize the tab system.
     * @param {HTMLElement} navContainer - The element to put buttons in.
     * @param {HTMLElement} contentRoot - The element where tab content lives.
     */
    init(navContainer, contentRoot) {
        // Define our available tabs
        const tabs = [
            { id: 'scenes', label: 'Scenes' },
            { id: 'map', label: 'Map' },
            { id: 'logic', label: 'Logic' },
            { id: 'design', label: 'Design' },
            { id: 'settings', label: 'Settings' }
        ];

        // 1. Create Buttons
        tabs.forEach(tab => {
            const btn = Dom.create('button', {
                class: 'tab-btn',
                id: `tab-btn-${tab.id}`,
                text: tab.label,
                onClick: () => this.switch(tab.id)
            });
            
            // Mark default active
            if (tab.id === this.activeTab) btn.classList.add('active');
            
            navContainer.appendChild(btn);
        });

        // 2. Create Content Containers
        tabs.forEach(tab => {
            const container = Dom.create('div', {
                id: `tab-content-${tab.id}`,
                class: 'h-full w-full hidden relative' // Start hidden
            });

            // Store reference
            this.containers[tab.id] = container;
            
            // Mount to DOM
            contentRoot.appendChild(container);
        });

        // Show default
        this.containers[this.activeTab].classList.remove('hidden');
    },

    /**
     * Switch the active tab.
     * @param {string} tabId 
     */
    switch(tabId) {
        if (!this.containers[tabId]) return;

        // 1. Update Buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`tab-btn-${tabId}`).classList.add('active');

        // 2. Update Content Visibility
        Object.values(this.containers).forEach(el => el.classList.add('hidden'));
        this.containers[tabId].classList.remove('hidden');

        this.activeTab = tabId;

        // 3. Emit Event (so tools can refresh, e.g., Map needs to redraw)
        Events.emit('tab:changed', tabId);
    },

    /**
     * Get the DOM container for a specific tab.
     * Useful for modules to inject their UI.
     * @param {string} tabId 
     * @returns {HTMLElement}
     */
    getContainer(tabId) {
        return this.containers[tabId];
    }
};