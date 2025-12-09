import { Dom } from '../../utils/Dom.js';
import { Store } from '../../data/Store.js';
import { Events } from '../../utils/Events.js';

export const SceneList = {
    init() {
        Events.on('project:loaded', () => this.render());
        Events.on('project:updated', () => this.render());
        Events.on('scene:selected', (id) => this.highlight(id));
        
        if (Store.project) this.render();
    },

    render() {
        const container = document.getElementById('scene-list'); // Restored ID
        if (!container) return;

        Dom.clear(container);
        const project = Store.getProject();
        if (!project) return;

        Object.values(project.scenes).forEach(scene => {
            container.appendChild(Dom.create('div', {
                class: 'list-item',
                dataset: { id: scene.id },
                onClick: () => Store.selectScene(scene.id)
            }, [
                Dom.create('span', { text: scene.id }),
                // Restored active styling logic will be handled by highlight()
            ]));
        });

        if (Store.activeSceneId) this.highlight(Store.activeSceneId);
    },

    highlight(id) {
        document.querySelectorAll('#scene-list .list-item').forEach(el => el.classList.remove('active'));
        const target = document.querySelector(`#scene-list .list-item[data-id="${id}"]`);
        if (target) target.classList.add('active');
    }
};