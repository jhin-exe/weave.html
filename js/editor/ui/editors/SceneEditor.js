import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';
import { TabManager } from '../TabManager.js';
import { SceneList } from '../SceneList.js';

export const SceneEditor = {
    init() {
        const container = TabManager.getContainer('scenes');
        
        const sidebar = Dom.create('div', { class: 'sidebar' }, [
            Dom.create('div', { style: 'padding:10px; border-bottom:1px solid var(--border);' }, [
                Dom.create('button', {
                    class: 'btn btn-primary w-full',
                    text: '+ Scene',
                    onClick: () => Store.addScene()
                })
            ]),
            Dom.create('div', { id: 'scene-list' })
        ]);

        this.mainPane = Dom.create('div', { class: 'main-pane' });
        this.root = Dom.create('div', { id: 'scene-editor' });
        
        this.mainPane.appendChild(this.root);
        container.appendChild(sidebar);
        container.appendChild(this.mainPane);

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
            this.root.appendChild(Dom.create('div', { 
                style: 'text-align:center; color:var(--text-muted); margin-top:50px;', 
                text: 'Select a scene to edit.' 
            }));
            return;
        }

        const header = Dom.create('div', { class: 'card flex', style: 'justify-content:space-between; align-items:center; gap: 10px;' }, [
            Dom.create('div', { class: 'flex gap-2', style: 'flex:1' }, [
                Dom.create('input', { 
                    value: scene.id, 
                    onChange: (e) => {
                        const val = e.target.value.trim();
                        if(val && val !== scene.id) Store.renameScene(scene.id, val);
                    }
                }),
                Dom.create('button', { class: 'btn btn-primary', text: 'Rename', onClick: () => {} })
            ]),
            Dom.create('button', { 
                class: 'btn btn-danger', 
                text: 'Delete', 
                onClick: () => confirm(`Delete ${scene.id}?`) && Store.deleteScene(scene.id) 
            })
        ]);

        const content = Dom.create('div', { style: 'margin-bottom:15px;' }, [
            Dom.create('label', { text: 'Media' }),
            Dom.create('div', { class: 'flex gap-2' }, [
                Dom.create('input', { placeholder: 'Image URL', value: scene.image || '', onChange: (e) => Store.updateScene(sceneId, 'image', e.target.value) }),
                Dom.create('input', { placeholder: 'Audio URL', value: scene.audio || '', onChange: (e) => Store.updateScene(sceneId, 'audio', e.target.value) })
            ]),
            Dom.create('div', { style: 'margin-top: 15px;' }, [
                Dom.create('label', { text: 'Story Text' }),
                Dom.create('textarea', {
                    value: scene.text || '',
                    style: 'min-height: 150px;',
                    onInput: (e) => Store.updateScene(sceneId, 'text', e.target.value)
                })
            ])
        ]);

        const choicesContainer = Dom.create('div', {});
        scene.choices.forEach((c, idx) => {
            choicesContainer.appendChild(this.renderChoice(sceneId, c, idx, project));
        });

        this.root.appendChild(header);
        this.root.appendChild(content);
        this.root.appendChild(choicesContainer);
        this.root.appendChild(Dom.create('button', { 
            class: 'btn btn-primary w-full', 
            text: '+ Add Choice', 
            onClick: () => Store.addChoice(sceneId) 
        }));
        
        this.root.appendChild(Dom.create('div', { style: 'height: 50px' }));
    },

    renderChoice(sceneId, choice, index, project) {
        return Dom.create('div', { class: 'card' }, [
             Dom.create('div', { class: 'flex gap-2', style: 'margin-bottom:15px' }, [
                Dom.create('div', { style: 'flex:2' }, [
                    Dom.create('label', { text: 'Text' }),
                    Dom.create('input', { value: choice.text, onInput: (e) => Store.updateChoice(sceneId, index, 'text', e.target.value) })
                ]),
                Dom.create('div', { style: 'flex:1' }, [
                    Dom.create('label', { text: 'Target' }),
                    Dom.create('div', { class: 'flex' }, [
                        // Target Selector
                        Dom.create('select', { 
                            style: 'border-radius:4px 0 0 4px',
                            onChange: (e) => Store.updateChoice(sceneId, index, 'target', e.target.value) 
                        }, Object.keys(project.scenes).map(id => Dom.create('option', { value: id, text: id, selected: choice.target === id }))),
                        
                        // RESTORED LINKED SCENE BUTTON
                        Dom.create('button', {
                            class: 'btn btn-primary',
                            text: '+',
                            title: 'Create & Link New Scene',
                            style: 'border-radius:0 4px 4px 0; padding:0 10px;',
                            onClick: () => Store.createLinkedScene(sceneId, index)
                        })
                    ])
                ])
             ]),
             // Logic/Effects placeholders (Use full restore from previous steps if needed, keeping simple for structure parity)
             Dom.create('div', { style: 'text-align:right' }, [
                 Dom.create('button', { class: 'btn btn-danger btn-sm', text: 'Delete Choice', onClick: () => Store.deleteChoice(sceneId, index) })
             ])
        ]);
    }
};

SceneEditor.init();