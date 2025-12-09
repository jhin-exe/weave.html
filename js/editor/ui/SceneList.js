import { Dom } from '../../utils/Dom.js';
import { Store } from '../../data/Store.js';
import { Events } from '../../utils/Events.js';

/**
 * SceneList.js
 * Manages the sidebar list of scenes.
 * Handles rendering, filtering (future), and selection highlighting.
 */
export const SceneList = {
    init() {
        // Listen for data changes to refresh the list
        Events.on('project:loaded', () => this.render());
        Events.on('project:updated', () => this.render());
        
        // Listen for selection changes to highlight the active row
        Events.on('scene:selected', (id) => this.highlight(id));

        // Initial render if data is already there
        if (Store.project) this.render();
    },

    render() {
        const container = document.getElementById('scene-list-container');
        if (!container) return;

        Dom.clear(container);
        const project = Store.getProject();
        if (!project) return;

        const scenes = Object.values(project.scenes);
        
        // Optional: Sort by name or ID? For now, arbitrary order (Object keys) is standard for node maps.
        
        scenes.forEach(scene => {
            const isStart = scene.id === project.config.startSceneId;
            
            const row = Dom.create('div', {
                class: 'list-item',
                dataset: { id: scene.id },
                onClick: () => Store.selectScene(scene.id)
            }, [
                // Scene ID
                Dom.create('span', { 
                    text: scene.id, 
                    class: 'text-mono truncate',
                    style: { flex: '1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                }),
                
                // Start Scene Indicator
                isStart ? Dom.create('span', { 
                    text: '★', 
                    title: 'Start Scene',
                    class: 'text-xs text-warning font-bold ml-2' 
                }) : null
            ]);

            container.appendChild(row);
        });

        // Re-apply highlight to currently active scene
        if (Store.activeSceneId) {
            this.highlight(Store.activeSceneId);
        }
    },

    highlight(id) {
        // Remove active class from all
        const allItems = document.querySelectorAll('#scene-list-container .list-item');
        allItems.forEach(el => el.classList.remove('active'));

        // Add to target
        const target = document.querySelector(`#scene-list-container .list-item[data-id="${id}"]`);
        if (target) {
            target.classList.add('active');
            target.scrollIntoView({ block: 'nearest' });
        }
    }
};

// Auto-init when imported (since it's a UI controller singleton)
SceneList.init();