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

    // --- THE CRITICAL FUNCTION ---
    renderChoice(sceneId, choice, index, project) {
        const card = Dom.create('div', { class: 'card' });

        // 1. Choice Header (ID)
        const header = Dom.create('div', { 
            style: 'background:rgba(0,0,0,0.3); padding:8px; border-bottom:1px solid var(--border); margin:-20px -20px 15px; border-radius:4px 4px 0 0; display:flex; justify-content:space-between; align-items:center;' 
        });
        header.appendChild(Dom.create('span', { text: `CHOICE #${index+1}`, style: 'font-size:10px; font-weight:bold; color:var(--text-muted)' }));
        header.appendChild(Dom.create('input', { 
            value: choice.id || '', 
            placeholder: 'ID', 
            style: 'width:100px; height:24px; padding:2px 5px; font-size:10px; background:transparent !important; border:none !important; text-align:right; color:var(--text-muted) !important;',
            onInput: (e) => Store.updateChoice(sceneId, index, 'id', e.target.value)
        }));
        card.appendChild(header);

        // 2. Main Inputs (Text & Target)
        const mainRow = Dom.create('div', { class: 'flex gap-2', style: 'margin-bottom:15px' });
        const textCol = Dom.create('div', { style: 'flex:2' }, [
            Dom.create('label', { text: 'Text' }),
            Dom.create('input', { value: choice.text, onInput: (e) => Store.updateChoice(sceneId, index, 'text', e.target.value) })
        ]);
        const targetCol = Dom.create('div', { style: 'flex:1' }, [
            Dom.create('label', { text: 'Target' }),
            Dom.create('div', { class: 'flex' }, [
                Dom.create('select', { 
                    style: 'border-radius:4px 0 0 4px',
                    onChange: (e) => Store.updateChoice(sceneId, index, 'target', e.target.value) 
                }, Object.keys(project.scenes).map(id => Dom.create('option', { value: id, text: id, selected: choice.target === id }))),
                Dom.create('button', { 
                    class: 'btn btn-primary', text: '+', title: 'Create Linked Scene', style: 'border-radius:0 4px 4px 0; padding:0 8px;',
                    onClick: () => Store.createLinkedScene(sceneId, index)
                })
            ])
        ]);
        mainRow.appendChild(textCol);
        mainRow.appendChild(targetCol);
        card.appendChild(mainRow);

        // 3. LOGIC GROUPS
        card.appendChild(Dom.create('label', { text: 'Logic (Requirements)' }));
        
        if (choice.logicGroups) {
            choice.logicGroups.forEach((group, gIdx) => {
                const groupDiv = Dom.create('div', { class: 'logic-group' });
                
                // Group Header
                const gHeader = Dom.create('div', { class: 'logic-header' }, [
                    Dom.create('span', { class: 'logic-label', text: 'REQUIRES (ALL TRUE)' }),
                    Dom.create('button', { class: 'btn btn-danger btn-sm', text: 'Remove Block', onClick: () => Store.deleteLogicGroup(sceneId, index, gIdx) })
                ]);
                groupDiv.appendChild(gHeader);

                // Conditions
                group.forEach((cond, cIdx) => {
                    const row = Dom.create('div', { class: 'logic-row' });
                    
                    // Type Select
                    const typeSel = Dom.create('select', { style: 'width:100px', onChange: (e) => Store.updateCondition(sceneId, index, gIdx, cIdx, 'type', e.target.value) }, [
                        Dom.create('option', { value: 'hasItem', text: 'Has Item', selected: cond.type === 'hasItem' }),
                        Dom.create('option', { value: '!hasItem', text: 'No Item', selected: cond.type === '!hasItem' }),
                        Dom.create('option', { value: 'varGT', text: 'Var >', selected: cond.type === 'varGT' }),
                        Dom.create('option', { value: 'varLT', text: 'Var <', selected: cond.type === 'varLT' }),
                        Dom.create('option', { value: 'varEQ', text: 'Var ==', selected: cond.type === 'varEQ' })
                    ]);

                    // Key Input (with Datalist support)
                    const keyInput = Dom.create('input', { 
                        value: cond.key, 
                        list: cond.type.includes('Item') ? 'list-items' : 'list-vars',
                        onInput: (e) => Store.updateCondition(sceneId, index, gIdx, cIdx, 'key', e.target.value)
                    });

                    row.appendChild(typeSel);
                    row.appendChild(keyInput);

                    // Value Input (Only for Variables)
                    if (!cond.type.includes('Item')) {
                        row.appendChild(Dom.create('input', { 
                            type: 'number', style: 'width:60px', value: cond.val, 
                            onInput: (e) => Store.updateCondition(sceneId, index, gIdx, cIdx, 'val', e.target.value)
                        }));
                    }

                    // Delete Condition
                    row.appendChild(Dom.create('button', { class: 'btn btn-danger btn-sm', text: 'x', onClick: () => Store.removeCondition(sceneId, index, gIdx, cIdx) }));
                    groupDiv.appendChild(row);
                });

                // Add Condition Button
                const addCondDiv = Dom.create('div', { style: 'text-align:right; margin-top:5px;' });
                addCondDiv.appendChild(Dom.create('button', { class: 'btn btn-sm', text: '+ Cond', onClick: () => Store.addCondition(sceneId, index, gIdx) }));
                groupDiv.appendChild(addCondDiv);

                card.appendChild(groupDiv);

                // OR Divider
                if (gIdx < choice.logicGroups.length - 1) {
                    card.appendChild(Dom.create('div', { class: 'divider', text: 'OR' }));
                }
            });
        }

        // Add Group Button
        card.appendChild(Dom.create('button', { 
            class: 'btn w-full btn-sm', style: 'border:1px dashed var(--border); margin-bottom:15px;', text: '+ New Logic Block',
            onClick: () => Store.addLogicGroup(sceneId, index)
        }));

        // 4. EFFECTS
        card.appendChild(Dom.create('label', { text: 'Effects (On Click)' }));

        if (choice.effects) {
            choice.effects.forEach((eff, eIdx) => {
                const row = Dom.create('div', { class: 'logic-row' });

                // Type Select
                const typeSel = Dom.create('select', { style: 'width:100px', onChange: (e) => Store.updateEffect(sceneId, index, eIdx, 'type', e.target.value) }, [
                    Dom.create('option', { value: 'varAdd', text: 'Var +', selected: eff.type === 'varAdd' }),
                    Dom.create('option', { value: 'varSub', text: 'Var -', selected: eff.type === 'varSub' }),
                    Dom.create('option', { value: 'varSet', text: 'Var =', selected: eff.type === 'varSet' }),
                    Dom.create('option', { value: 'addItem', text: 'Get Item', selected: eff.type === 'addItem' }),
                    Dom.create('option', { value: 'remItem', text: 'Lose Item', selected: eff.type === 'remItem' }),
                    Dom.create('option', { value: 'playSound', text: 'Play Sound', selected: eff.type === 'playSound' })
                ]);

                // Key Input
                const keyInput = Dom.create('input', { 
                    value: eff.key, 
                    placeholder: eff.type === 'playSound' ? 'Audio URL' : 'Key',
                    list: eff.type.includes('Item') ? 'list-items' : 'list-vars',
                    onInput: (e) => Store.updateEffect(sceneId, index, eIdx, 'key', e.target.value)
                });

                row.appendChild(typeSel);
                row.appendChild(keyInput);

                // Value Input
                if (!eff.type.includes('Item') && eff.type !== 'playSound') {
                    row.appendChild(Dom.create('input', { 
                        type: 'number', style: 'width:60px', value: eff.val, 
                        onInput: (e) => Store.updateEffect(sceneId, index, eIdx, 'val', e.target.value)
                    }));
                }

                // Delete Effect
                row.appendChild(Dom.create('button', { class: 'btn btn-danger btn-sm', text: 'x', onClick: () => Store.removeEffect(sceneId, index, eIdx) }));
                card.appendChild(row);
            });
        }

        // Add Effect Button
        card.appendChild(Dom.create('button', { class: 'btn btn-sm', style: 'margin-top:5px;', text: '+ Effect', onClick: () => Store.addEffect(sceneId, index) }));

        // 5. Delete Choice Footer
        const footer = Dom.create('div', { style: 'text-align:right; margin-top:10px; border-top:1px solid var(--border); padding-top:10px;' });
        footer.appendChild(Dom.create('button', { class: 'btn btn-danger btn-sm', text: 'Delete Choice', onClick: () => Store.deleteChoice(sceneId, index) }));
        card.appendChild(footer);

        return card;
    }
};

SceneEditor.init();