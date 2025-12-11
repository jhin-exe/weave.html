import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';

export const ChoiceModal = {
    show(sceneId, choiceIndex) {
        // --- 1. SETUP MODAL CONTAINER ---
        let modal = document.getElementById('choice-editor-modal');
        if (!modal) {
            modal = Dom.create('div', { id: 'choice-editor-modal', class: 'hidden' }, [
                Dom.create('div', { id: 'modal-backdrop', style: 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:900;', onClick: () => this.hide() }),
                Dom.create('div', { 
                    id: 'modal-content', 
                    style: 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); max-width:600px; width:90%; background:var(--bg-panel); border:1px solid var(--border); padding:20px; border-radius:8px; z-index:901; max-height:80vh; overflow-y:auto;'
                })
            ]);
            document.body.appendChild(modal);
        }

        const content = document.getElementById('modal-content');
        Dom.clear(content);
        
        const closeBtn = Dom.create('button', { 
            class: 'btn btn-sm', text: 'Close (X)', style: 'position:absolute; top:10px; right:10px; z-index:902',
            onClick: () => this.hide() 
        });
        
        content.appendChild(closeBtn);
        
        // --- 2. RENDER CONTENT ---
        const editorContent = this.renderChoiceEditor(sceneId, choiceIndex);
        content.appendChild(editorContent);
        
        modal.classList.remove('hidden');

        // Refresh Map/Scene editor when modal closes to ensure visual sync
        this.updateListener = () => Events.emit('project:updated');
        Events.on('scene:updated', this.updateListener);
    },

    hide() {
        document.getElementById('choice-editor-modal')?.classList.add('hidden');
        if (this.updateListener) Events.off('scene:updated', this.updateListener);
        Events.emit('project:updated'); // Final sync
    },

    /**
     * Renders the core editing UI (pulled from SceneEditor.js)
     */
    renderChoiceEditor(sceneId, choiceIndex) {
        const project = Store.getProject();
        const scene = project.scenes[sceneId];
        const choice = scene.choices[choiceIndex];
        const allScenes = Object.keys(project.scenes);

        const card = Dom.create('div', { class: 'card', style:'margin:0' });

        // 1. Choice Header (ID)
        const header = Dom.create('div', { 
            style: 'background:rgba(0,0,0,0.3); padding:8px; border-bottom:1px solid var(--border); margin:-20px -20px 15px; border-radius:4px 4px 0 0; display:flex; justify-content:space-between; align-items:center;' 
        });
        header.appendChild(Dom.create('span', { text: `Editing Choice in: ${sceneId}`, style: 'font-size:10px; font-weight:bold; color:var(--primary)' }));
        header.appendChild(Dom.create('input', { 
            value: choice.id || '', 
            placeholder: 'ID', 
            style: 'width:100px; height:24px; padding:2px 5px; font-size:10px; background:transparent !important; border:none !important; text-align:right; color:var(--text-muted) !important;',
            onInput: (e) => Store.updateChoice(sceneId, choiceIndex, 'id', e.target.value)
        }));
        card.appendChild(header);

        // 2. Main Inputs (Text & Target)
        const mainRow = Dom.create('div', { class: 'flex gap-2', style: 'margin-bottom:15px' });
        const textCol = Dom.create('div', { style: 'flex:2' }, [
            Dom.create('label', { text: 'Text' }),
            Dom.create('input', { value: choice.text, onInput: (e) => Store.updateChoice(sceneId, choiceIndex, 'text', e.target.value) })
        ]);
        const targetCol = Dom.create('div', { style: 'flex:1' }, [
            Dom.create('label', { text: 'Target' }),
            Dom.create('div', { class: 'flex' }, [
                Dom.create('select', { 
                    style: 'border-radius:4px 0 0 4px',
                    onChange: (e) => Store.updateChoice(sceneId, choiceIndex, 'target', e.target.value) 
                }, allScenes.map(id => Dom.create('option', { value: id, text: id, selected: choice.target === id }))),
                Dom.create('button', { 
                    class: 'btn btn-primary', text: '+', title: 'Create Linked Scene', style: 'border-radius:0 4px 4px 0; padding:0 8px;',
                    onClick: () => { Store.createLinkedScene(sceneId, choiceIndex); this.hide(); } // Hide after creation
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
                
                const gHeader = Dom.create('div', { class: 'logic-header' }, [
                    Dom.create('span', { class: 'logic-label', text: 'REQUIRES (ALL TRUE)' }),
                    Dom.create('button', { class: 'btn btn-danger btn-sm', text: 'Remove Block', onClick: () => { Store.deleteLogicGroup(sceneId, choiceIndex, gIdx); this.rerender(sceneId, choiceIndex); } })
                ]);
                groupDiv.appendChild(gHeader);

                group.forEach((cond, cIdx) => {
                    const row = Dom.create('div', { class: 'logic-row' });
                    
                    const typeSel = Dom.create('select', { style: 'width:100px', onChange: (e) => { Store.updateCondition(sceneId, choiceIndex, gIdx, cIdx, 'type', e.target.value); this.rerender(sceneId, choiceIndex); } }, [
                        Dom.create('option', { value: 'hasItem', text: 'Has Item', selected: cond.type === 'hasItem' }),
                        Dom.create('option', { value: '!hasItem', text: 'No Item', selected: cond.type === '!hasItem' }),
                        Dom.create('option', { value: 'varGT', text: 'Var >', selected: cond.type === 'varGT' }),
                        Dom.create('option', { value: 'varLT', text: 'Var <', selected: cond.type === 'varLT' }),
                        Dom.create('option', { value: 'varEQ', text: 'Var ==', selected: cond.type === 'varEQ' })
                    ]);

                    const keyInput = Dom.create('input', { 
                        value: cond.key, 
                        list: cond.type.includes('Item') ? 'list-items' : 'list-vars',
                        onInput: (e) => Store.updateCondition(sceneId, choiceIndex, gIdx, cIdx, 'key', e.target.value)
                    });

                    row.appendChild(typeSel);
                    row.appendChild(keyInput);

                    if (!cond.type.includes('Item')) {
                        row.appendChild(Dom.create('input', { 
                            type: 'number', style: 'width:60px', value: cond.val, 
                            onInput: (e) => Store.updateCondition(sceneId, choiceIndex, gIdx, cIdx, 'val', e.target.value)
                        }));
                    }

                    row.appendChild(Dom.create('button', { class: 'btn btn-danger btn-sm', text: 'x', onClick: () => { Store.removeCondition(sceneId, choiceIndex, gIdx, cIdx); this.rerender(sceneId, choiceIndex); } }));
                    groupDiv.appendChild(row);
                });

                const addCondDiv = Dom.create('div', { style: 'text-align:right; margin-top:5px;' });
                addCondDiv.appendChild(Dom.create('button', { class: 'btn btn-sm', text: '+ Cond', onClick: () => { Store.addCondition(sceneId, choiceIndex, gIdx); this.rerender(sceneId, choiceIndex); } }));
                groupDiv.appendChild(addCondDiv);

                card.appendChild(groupDiv);

                if (gIdx < choice.logicGroups.length - 1) {
                    card.appendChild(Dom.create('div', { class: 'divider', text: 'OR' }));
                }
            });
        }

        card.appendChild(Dom.create('button', { 
            class: 'btn w-full btn-sm', style: 'border:1px dashed var(--border); margin-bottom:15px;', text: '+ New Logic Block',
            onClick: () => { Store.addLogicGroup(sceneId, choiceIndex); this.rerender(sceneId, choiceIndex); }
        }));

        // 4. EFFECTS
        card.appendChild(Dom.create('label', { text: 'Effects (On Click)' }));

        if (choice.effects) {
            choice.effects.forEach((eff, eIdx) => {
                const row = Dom.create('div', { class: 'logic-row' });

                const typeSel = Dom.create('select', { style: 'width:100px', onChange: (e) => { Store.updateEffect(sceneId, choiceIndex, eIdx, 'type', e.target.value); this.rerender(sceneId, choiceIndex); } }, [
                    Dom.create('option', { value: 'varAdd', text: 'Var +', selected: eff.type === 'varAdd' }),
                    Dom.create('option', { value: 'varSub', text: 'Var -', selected: eff.type === 'varSub' }),
                    Dom.create('option', { value: 'varSet', text: 'Var =', selected: eff.type === 'varSet' }),
                    Dom.create('option', { value: 'addItem', text: 'Get Item', selected: eff.type === 'addItem' }),
                    Dom.create('option', { value: 'remItem', text: 'Lose Item', selected: eff.type === 'remItem' }),
                    Dom.create('option', { value: 'playSound', text: 'Play Sound', selected: eff.type === 'playSound' })
                ]);

                const keyInput = Dom.create('input', { 
                    value: eff.key, 
                    placeholder: eff.type === 'playSound' ? 'Audio URL' : 'Key',
                    list: eff.type.includes('Item') ? 'list-items' : 'list-vars',
                    onInput: (e) => Store.updateEffect(sceneId, choiceIndex, eIdx, 'key', e.target.value)
                });

                row.appendChild(typeSel);
                row.appendChild(keyInput);

                if (!eff.type.includes('Item') && eff.type !== 'playSound') {
                    row.appendChild(Dom.create('input', { 
                        type: 'number', style: 'width:60px', value: eff.val, 
                        onInput: (e) => Store.updateEffect(sceneId, choiceIndex, eIdx, 'val', e.target.value)
                    }));
                }

                row.appendChild(Dom.create('button', { class: 'btn btn-danger btn-sm', text: 'x', onClick: () => { Store.removeEffect(sceneId, choiceIndex, eIdx); this.rerender(sceneId, choiceIndex); } }));
                card.appendChild(row);
            });
        }

        // Add Effect Button
        card.appendChild(Dom.create('button', { class: 'btn btn-sm', style: 'margin-top:5px;', text: '+ Effect', onClick: () => { Store.addEffect(sceneId, choiceIndex); this.rerender(sceneId, choiceIndex); } }));

        // 5. Delete Choice Footer
        const footer = Dom.create('div', { style: 'text-align:right; margin-top:10px; border-top:1px solid var(--border); padding-top:10px;' });
        footer.appendChild(Dom.create('button', { class: 'btn btn-danger btn-sm', text: 'Delete Choice', onClick: () => { Store.deleteChoice(sceneId, choiceIndex); this.hide(); } }));
        card.appendChild(footer);

        return card;
    },

    rerender(sceneId, choiceIndex) {
        const content = document.getElementById('modal-content');
        if (content) {
            // Keep the header/close button, replace the form
            // Or just rebuild it entirely for simplicity
            const closeBtn = content.querySelector('button'); // Preserve close button if possible or recreate
            Dom.clear(content);
            
            content.appendChild(Dom.create('button', { 
                class: 'btn btn-sm', text: 'Close (X)', style: 'position:absolute; top:10px; right:10px; z-index:902',
                onClick: () => this.hide() 
            }));
            
            content.appendChild(this.renderChoiceEditor(sceneId, choiceIndex));
        }
    }
};