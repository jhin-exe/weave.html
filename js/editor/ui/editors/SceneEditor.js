import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';
import { TabManager } from '../TabManager.js';
import { SceneList } from '../SceneList.js';

/**
 * SceneEditor.js
 * The core workspace. Handles editing text, media, and the complex choice logic.
 * Now integrated with the sidebar layout.
 */
export const SceneEditor = {
    init() {
        const container = TabManager.getContainer('scenes');
        
        // Create the Split Layout
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
            // This container is where SceneList.js will render
            Dom.create('div', { id: 'scene-list-container', class: 'flex-1 scroll-y' })
        ]);

        // Right: Main Editor
        this.mainPane = Dom.create('div', { class: 'editor-main' });
        
        // Wrapper for the actual form
        this.root = Dom.create('div', { id: 'scene-editor-form', style: { maxWidth: '800px', margin: '0 auto' } });
        this.mainPane.appendChild(this.root);

        split.appendChild(sidebar);
        split.appendChild(this.mainPane);
        container.appendChild(split);

        // Initialize the List Logic
        SceneList.init();

        // Listen for selection
        Events.on('scene:selected', (id) => this.render(id));
        Events.on('scene:updated', (data) => {
            // Only re-render if we are looking at the scene that updated
            // AND the update wasn't a text input (to prevent losing focus/cursor position)
            if (data.id === this.currentId && !['text', 'id'].includes(data.field)) {
                this.render(data.id);
            }
        });
    },

    /**
     * Renders the editor for a specific scene.
     * @param {string} sceneId 
     */
    render(sceneId) {
        this.currentId = sceneId;
        const project = Store.getProject();
        const scene = project.scenes[sceneId];
        
        Dom.clear(this.root);

        if (!scene) {
            this.root.appendChild(Dom.create('div', { class: 'text-muted text-center mt-4', text: 'Select a scene to edit.' }));
            return;
        }

        // --- 1. HEADER (ID & Actions) ---
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
                text: 'Delete Scene',
                onClick: () => {
                    if (confirm(`Delete scene "${scene.id}"? This cannot be undone.`)) {
                        Store.deleteScene(scene.id);
                    }
                }
            })
        ]);

        // --- 2. CONTENT (Text & Media) ---
        const contentCard = Dom.create('div', { class: 'card' }, [
            Dom.create('div', { class: 'section-header', text: 'Content' }),
            
            // Media Inputs
            Dom.create('div', { class: 'flex gap-2 mb-2' }, [
                Dom.create('div', { class: 'flex-1' }, [
                    Dom.create('label', { text: 'Image URL' }),
                    Dom.create('input', {
                        type: 'text',
                        placeholder: 'assets/bg.jpg or https://...',
                        value: scene.image || '',
                        onChange: (e) => Store.updateScene(sceneId, 'image', e.target.value)
                    })
                ]),
                Dom.create('div', { class: 'flex-1' }, [
                    Dom.create('label', { text: 'Audio URL' }),
                    Dom.create('input', {
                        type: 'text',
                        placeholder: 'assets/music.mp3',
                        value: scene.audio || '',
                        onChange: (e) => Store.updateScene(sceneId, 'audio', e.target.value)
                    })
                ])
            ]),

            // Text Area
            Dom.create('label', { text: 'Story Text (Markdown Supported)' }),
            Dom.create('textarea', {
                value: scene.text || '',
                style: { height: '150px', fontFamily: 'var(--font-serif)', fontSize: '14px' },
                onInput: (e) => Store.updateScene(sceneId, 'text', e.target.value) 
            })
        ]);

        // --- 3. CHOICES ---
        const choicesHeader = Dom.create('div', { class: 'flex justify-between items-center mb-2' }, [
            Dom.create('h3', { text: 'Choices', class: 'text-sm font-bold text-muted m-0' }),
            Dom.create('button', {
                class: 'btn btn-primary btn-sm',
                text: '+ Add Choice',
                onClick: () => Store.addChoice(sceneId)
            })
        ]);

        const choicesContainer = Dom.create('div', { class: 'flex-col gap-2' });
        
        scene.choices.forEach((choice, idx) => {
            choicesContainer.appendChild(this.renderChoice(sceneId, choice, idx, project));
        });

        // Assemble
        this.root.appendChild(header);
        this.root.appendChild(contentCard);
        this.root.appendChild(choicesHeader);
        this.root.appendChild(choicesContainer);
        
        // Add extra padding at bottom for scrolling
        this.root.appendChild(Dom.create('div', { style: { height: '100px' } }));
    },

    /**
     * Renders a single choice card.
     */
    renderChoice(sceneId, choice, index, project) {
        const sceneList = Object.keys(project.scenes);

        // -- Top Bar (Text & Target) --
        const topBar = Dom.create('div', { class: 'flex gap-2 mb-3 items-end' }, [
            // Choice Text
            Dom.create('div', { class: 'flex-1' }, [
                Dom.create('label', { text: 'Label' }),
                Dom.create('input', {
                    type: 'text',
                    value: choice.text,
                    onInput: (e) => Store.updateChoice(sceneId, index, 'text', e.target.value)
                })
            ]),
            // Target Scene
            Dom.create('div', { style: { flex: '0 0 150px' } }, [
                Dom.create('label', { text: 'Target' }),
                Dom.create('select', {
                    onChange: (e) => Store.updateChoice(sceneId, index, 'target', e.target.value)
                }, [
                    ...sceneList.map(id => Dom.create('option', { 
                        value: id, 
                        text: id, 
                        selected: choice.target === id 
                    })),
                    Dom.create('option', { value: '_new', text: '+ New Scene...' }) 
                ])
            ])
        ]);

        // *Logic Groups Helper*
        const renderLogicGroup = (group, gIdx) => {
            return Dom.create('div', { class: 'p-2 bg-zinc-900 border border-zinc-700 rounded mb-1' }, [
                Dom.create('div', { class: 'text-xs text-muted mb-1 flex justify-between' }, [
                    Dom.create('span', { text: `Condition Group ${gIdx + 1} (AND)` }),
                    Dom.create('button', { 
                        class: 'text-danger hover:text-white', 
                        text: '×', 
                        onClick: () => {
                            const newGroups = [...choice.logicGroups];
                            newGroups.splice(gIdx, 1);
                            Store.updateChoice(sceneId, index, 'logicGroups', newGroups);
                        }
                    })
                ]),
                ...group.map((cond, cIdx) => Dom.create('div', { class: 'flex gap-1 mb-1' }, [
                    Dom.create('select', { 
                        class: 'text-xs w-24',
                        value: cond.type,
                        onChange: (e) => {
                            const newGroups = [...choice.logicGroups];
                            newGroups[gIdx][cIdx].type = e.target.value;
                            Store.updateChoice(sceneId, index, 'logicGroups', newGroups);
                        }
                    }, [
                        Dom.create('option', { value: 'hasItem', text: 'Has Item' }),
                        Dom.create('option', { value: '!hasItem', text: 'No Item' }),
                        Dom.create('option', { value: 'varGT', text: 'Var >' }),
                        Dom.create('option', { value: 'varLT', text: 'Var <' }),
                        Dom.create('option', { value: 'varEQ', text: 'Var =' }),
                    ]),
                    Dom.create('input', { 
                        class: 'text-xs flex-1', 
                        value: cond.key, 
                        placeholder: 'Key',
                        onInput: (e) => {
                            const newGroups = [...choice.logicGroups];
                            newGroups[gIdx][cIdx].key = e.target.value;
                            Store.updateChoice(sceneId, index, 'logicGroups', newGroups);
                        }
                    }),
                    Dom.create('input', { 
                        class: 'text-xs w-16', 
                        value: cond.val || '', 
                        placeholder: 'Val',
                        type: cond.type.includes('Item') ? 'hidden' : 'text',
                        onInput: (e) => {
                            const newGroups = [...choice.logicGroups];
                            newGroups[gIdx][cIdx].val = e.target.value;
                            Store.updateChoice(sceneId, index, 'logicGroups', newGroups);
                        }
                    }),
                    Dom.create('button', { 
                        class: 'btn-sm btn-ghost text-danger', 
                        text: '×',
                        onClick: () => {
                            const newGroups = [...choice.logicGroups];
                            newGroups[gIdx].splice(cIdx, 1);
                            if (newGroups[gIdx].length === 0) newGroups.splice(gIdx, 1);
                            Store.updateChoice(sceneId, index, 'logicGroups', newGroups);
                        }
                    })
                ])),
                Dom.create('button', { 
                    class: 'text-xs text-primary mt-1', 
                    text: '+ Condition', 
                    onClick: () => {
                        const newGroups = [...choice.logicGroups];
                        newGroups[gIdx].push({ type: 'hasItem', key: '', val: '' });
                        Store.updateChoice(sceneId, index, 'logicGroups', newGroups);
                    }
                })
            ]);
        };

        // *Effects Helper*
        const renderEffect = (eff, eIdx) => {
            return Dom.create('div', { class: 'flex gap-1 mb-1 items-center' }, [
                Dom.create('select', { 
                    class: 'text-xs w-24',
                    value: eff.type,
                    onChange: (e) => {
                        const newEff = [...choice.effects];
                        newEff[eIdx].type = e.target.value;
                        Store.updateChoice(sceneId, index, 'effects', newEff);
                    }
                }, [
                    Dom.create('option', { value: 'addItem', text: 'Get Item' }),
                    Dom.create('option', { value: 'remItem', text: 'Lose Item' }),
                    Dom.create('option', { value: 'varAdd', text: 'Var Add' }),
                    Dom.create('option', { value: 'varSub', text: 'Var Sub' }),
                    Dom.create('option', { value: 'varSet', text: 'Var Set' }),
                    Dom.create('option', { value: 'playSound', text: 'Sound' }),
                ]),
                Dom.create('input', { 
                    class: 'text-xs flex-1', 
                    value: eff.key, 
                    placeholder: 'Key / ID',
                    onInput: (e) => {
                        const newEff = [...choice.effects];
                        newEff[eIdx].key = e.target.value;
                        Store.updateChoice(sceneId, index, 'effects', newEff);
                    }
                }),
                Dom.create('input', { 
                    class: 'text-xs w-16', 
                    value: eff.val || '', 
                    placeholder: 'Val',
                    type: (eff.type.includes('Item') || eff.type === 'playSound') ? 'hidden' : 'text',
                    onInput: (e) => {
                        const newEff = [...choice.effects];
                        newEff[eIdx].val = e.target.value;
                        Store.updateChoice(sceneId, index, 'effects', newEff);
                    }
                }),
                Dom.create('button', { 
                    class: 'btn-sm btn-ghost text-danger', 
                    text: '×',
                    onClick: () => {
                        const newEff = [...choice.effects];
                        newEff.splice(eIdx, 1);
                        Store.updateChoice(sceneId, index, 'effects', newEff);
                    }
                })
            ]);
        };


        return Dom.create('div', { class: 'card p-3 border-l-4 border-l-zinc-700 hover:border-l-zinc-500 transition-colors' }, [
            topBar,
            
            // Logic Section
            Dom.create('div', { class: 'mb-2' }, [
                Dom.create('div', { class: 'flex justify-between items-center mb-1' }, [
                    Dom.create('span', { text: 'Logic (Requirements)', class: 'text-xs font-bold text-muted' }),
                    Dom.create('button', { 
                        class: 'text-xs text-primary', 
                        text: '+ Group', 
                        onClick: () => {
                            const newGroups = [...(choice.logicGroups || [])];
                            newGroups.push([{ type: 'hasItem', key: '', val: '' }]);
                            Store.updateChoice(sceneId, index, 'logicGroups', newGroups);
                        }
                    })
                ]),
                ...(choice.logicGroups || []).map((grp, i) => renderLogicGroup(grp, i))
            ]),

            // Effects Section
            Dom.create('div', { class: 'mb-2' }, [
                Dom.create('div', { class: 'flex justify-between items-center mb-1' }, [
                    Dom.create('span', { text: 'Effects (On Click)', class: 'text-xs font-bold text-muted' }),
                    Dom.create('button', { 
                        class: 'text-xs text-primary', 
                        text: '+ Effect', 
                        onClick: () => {
                            const newEff = [...(choice.effects || [])];
                            newEff.push({ type: 'addItem', key: '', val: '' });
                            Store.updateChoice(sceneId, index, 'effects', newEff);
                        }
                    })
                ]),
                ...(choice.effects || []).map((eff, i) => renderEffect(eff, i))
            ]),

            // Footer
            Dom.create('div', { class: 'flex justify-end border-t border-zinc-800 pt-2 mt-2' }, [
                Dom.create('button', {
                    class: 'btn btn-danger btn-sm',
                    text: 'Delete Choice',
                    onClick: () => Store.deleteChoice(sceneId, index)
                })
            ])
        ]);
    }
};