import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';

export const QuickEditModal = {
    show(sceneId, x, y) {
        const project = Store.getProject();
        const scene = project.scenes[sceneId];
        if (!scene) return;

        // Remove existing if open
        this.hide();

        const modal = Dom.create('div', { 
            id: 'quick-edit-modal', 
            class: 'card',
            style: `position:absolute; left:${x}px; top:${y}px; width:300px; z-index:1000; box-shadow:0 10px 30px #000; border:1px solid var(--accent);`
        });

        // Header
        const header = Dom.create('div', { class: 'flex justify-between items-center mb-2' }, [
            Dom.create('span', { text: sceneId, style: 'font-weight:bold; color:var(--accent); font-family:monospace;' }),
            Dom.create('button', { class: 'btn btn-sm btn-danger', text: 'x', onClick: () => this.hide() })
        ]);

        // Inputs
        const form = Dom.create('div', { class: 'flex-col gap-2' }, [
            Dom.create('label', { text: 'Content', style:'font-size:10px; color:var(--text-muted);' }),
            Dom.create('textarea', { 
                value: scene.text, 
                style: 'height:80px;',
                onInput: (e) => Store.updateScene(sceneId, 'text', e.target.value) 
            }),
            Dom.create('input', { 
                value: scene.image, 
                placeholder: 'Image URL', 
                onInput: (e) => Store.updateScene(sceneId, 'image', e.target.value) 
            }),
            Dom.create('input', { 
                value: scene.audio, 
                placeholder: 'Audio URL', 
                onInput: (e) => Store.updateScene(sceneId, 'audio', e.target.value) 
            })
        ]);

        modal.appendChild(header);
        modal.appendChild(form);
        
        // Append to body or map container? Body is safer for z-index
        document.body.appendChild(modal);

        // Close on outside click logic could go here
    },

    hide() {
        const el = document.getElementById('quick-edit-modal');
        if (el) el.remove();
    }
};