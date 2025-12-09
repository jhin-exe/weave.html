import { Dom } from '../../utils/Dom.js';
import { Store } from '../../data/Store.js';
import { Events } from '../../utils/Events.js';

export const SceneList = {
    init() {
        Events.on('project:loaded', () => this.render());
        Events.on('project:updated', () => this.render());
        Events.on('scene:selected', (id) => this.highlight(id));
        
        // Try rendering immediately if data exists
        if (Store.project) this.render();
    },

    render() {
        const container = document.getElementById('scene-list-container');
        if (!container) return; // Wait for SceneEditor to create the DOM

        Dom.clear(container);
        const project = Store.getProject();
        if (!project) return;

        Object.values(project.scenes).forEach(scene => {
            const isStart = scene.id === project.config.startSceneId;
            container.appendChild(Dom.create('div', {
                class: 'list-item',
                dataset: { id: scene.id },
                onClick: () => Store.selectScene(scene.id)
            }, [
                Dom.create('span', { text: scene.id, class: 'text-mono truncate' }),
                isStart ? Dom.create('span', { text: '★', class: 'text-warning font-bold' }) : null
            ]));
        });

        if (Store.activeSceneId) this.highlight(Store.activeSceneId);
    },

    highlight(id) {
        document.querySelectorAll('#scene-list-container .list-item').forEach(el => el.classList.remove('active'));
        const target = document.querySelector(`#scene-list-container .list-item[data-id="${id}"]`);
        if (target) target.classList.add('active');
    }
};