import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';
import { TabManager } from '../TabManager.js';
import { SceneList } from '../SceneList.js';

export const SceneEditor = {
    init() {
        const container = TabManager.getContainer('scenes');
        
        // The Split Layout (Sidebar Left, Editor Right)
        const split = Dom.create('div', { class: 'editor-split' });
        
        // Left: Sidebar
        const sidebar = Dom.create('div', { class: 'editor-sidebar' }, [
            Dom.create('div', { class: 'p-2 border-b border-zinc-700' }, [
                Dom.create('button', {
                    class: 'btn w-full',
                    text: '+ New Scene',
                    onClick: () => Store.addScene()
                })
            ]),
            // SCENE LIST CONTAINER
            Dom.create('div', { id: 'scene-list-container', class: 'flex-1 scroll-y' })
        ]);

        // Right: Main Editor
        this.mainPane = Dom.create('div', { class: 'editor-main' });
        this.root = Dom.create('div', { id: 'scene-editor-form', style: { maxWidth: '800px', margin: '0 auto' } });
        this.mainPane.appendChild(this.root);

        split.appendChild(sidebar);
        split.appendChild(this.mainPane);
        container.appendChild(split);

        // Init the list logic
        SceneList.init();

        Events.on('scene:selected', (id) => this.render(id));
        Events.on('scene:updated', (data) => {
            if (data.id === this.currentId && !['text', 'id'].includes(data.field)) {
                this.render(data.id);
            }
        });
    },

    render(sceneId) {
        this.currentId = sceneId;
        const project = Store.getProject();
        const scene = project.scenes[sceneId];
        
        Dom.clear(this.root);

        if (!scene) {
            this.root.appendChild(Dom.create('div', { class: 'text-muted text-center mt-4', text: 'Select a scene to edit.' }));
            return;
        }

        // --- Header ---
        const header = Dom.create('div', { class: 'card flex justify-between items-center mb-4' }, [
            Dom.create('div', { class: 'flex items-center gap-2 flex-1' }, [
                Dom.create('label', { text: 'ID:', class: 'm-0 text-xs' }),
                Dom.create('input', {
                    type: 'text',
                    value: scene.id,
                    class: 'font-bold font-mono',
                    style: { width: '200px' },
                    onChange: (e) => {
                        const newId = e.target.value.trim();
                        if (newId && newId !== scene.id) Store.renameScene(scene.id, newId);
                    }
                })
            ]),
            Dom.create('button', {
                class: 'btn btn-danger btn-sm',
                text: 'Delete',
                onClick: () => confirm(`Delete ${scene.id}?`) && Store.deleteScene(scene.id)
            })
        ]);

        // --- Content ---
        const content = Dom.create('div', { class: 'card' }, [
            Dom.create('div', { class: 'section-header', text: 'Content' }),
            Dom.create('div', { class: 'flex gap-2 mb-2' }, [
                Dom.create('input', { placeholder: 'Image URL', value: scene.image || '', onChange: (e) => Store.updateScene(sceneId, 'image', e.target.value) }),
                Dom.create('input', { placeholder: 'Audio URL', value: scene.audio || '', onChange: (e) => Store.updateScene(sceneId, 'audio', e.target.value) })
            ]),
            Dom.create('textarea', {
                value: scene.text || '',
                style: { height: '150px', fontFamily: 'var(--font-serif)', fontSize: '14px' },
                onInput: (e) => Store.updateScene(sceneId, 'text', e.target.value)
            })
        ]);

        // --- Choices ---
        const choicesDiv = Dom.create('div', { class: 'flex-col gap-2' });
        scene.choices.forEach((c, idx) => {
             choicesDiv.appendChild(this.renderChoiceCard(sceneId, c, idx, project));
        });

        this.root.appendChild(header);
        this.root.appendChild(content);
        this.root.appendChild(Dom.create('button', { class: 'btn btn-primary w-full mt-4', text: '+ Add Choice', onClick: () => Store.addChoice(sceneId) }));
        this.root.appendChild(Dom.create('div', { class: 'mt-4' }, [choicesDiv]));
    },

    renderChoiceCard(sceneId, choice, index, project) {
        return Dom.create('div', { class: 'card p-3 mb-2' }, [
            Dom.create('div', { class: 'flex gap-2 mb-2' }, [
                Dom.create('input', { value: choice.text, onInput: (e) => Store.updateChoice(sceneId, index, 'text', e.target.value) }),
                Dom.create('select', { onChange: (e) => Store.updateChoice(sceneId, index, 'target', e.target.value) }, [
                     ...Object.keys(project.scenes).map(id => Dom.create('option', { value: id, text: id, selected: choice.target === id }))
                ])
            ]),
            Dom.create('button', { class: 'btn btn-danger btn-sm', text: 'Delete', onClick: () => Store.deleteChoice(sceneId, index) })
        ]);
    }
};

SceneEditor.init();