import { Dom } from '../../utils/Dom.js';
import { Events } from '../../utils/Events.js';

export const TabManager = {
    activeTab: 'scenes',
    containers: {},

    init(navContainer, contentRoot) {
        const tabs = [
            { id: 'scenes', label: 'Scenes' },
            { id: 'map', label: 'Map' },
            { id: 'logic', label: 'Logic' },
            { id: 'design', label: 'Design' },
            { id: 'settings', label: 'Settings' }
        ];

        // 1. Create Buttons
        tabs.forEach(tab => {
            navContainer.appendChild(Dom.create('button', {
                class: `tab-btn ${tab.id === this.activeTab ? 'active' : ''}`,
                id: `tab-btn-${tab.id}`,
                text: tab.label,
                onClick: () => this.switch(tab.id)
            }));
        });

        // 2. Create Content Containers
        tabs.forEach(tab => {
            const container = Dom.create('div', {
                id: `tab-content-${tab.id}`,
                // "tab-pane" is the key class matching main.css
                class: `tab-pane ${tab.id === this.activeTab ? '' : 'hidden'}` 
            });
            this.containers[tab.id] = container;
            contentRoot.appendChild(container);
        });
    },

    switch(tabId) {
        if (!this.containers[tabId]) return;

        // Update Buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tab-btn-${tabId}`).classList.add('active');

        // Update Content
        Object.values(this.containers).forEach(el => el.classList.add('hidden'));
        this.containers[tabId].classList.remove('hidden');

        this.activeTab = tabId;
        Events.emit('tab:changed', tabId);
    },

    getContainer(tabId) {
        return this.containers[tabId];
    }
};