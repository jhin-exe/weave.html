import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { TabManager } from '../TabManager.js';
import { Events } from '../../../utils/Events.js';

export const SettingsEditor = {
    init() {
        const container = TabManager.getContainer('settings');
        this.root = Dom.create('div', { class: 'p-4', style: { maxWidth: '600px', margin: '0 auto' } });
        container.appendChild(this.root);
        
        Events.on('tab:changed', (id) => { if(id === 'settings') this.render(); });
    },

    render() {
        Dom.clear(this.root);
        const project = Store.getProject();
        if(!project) return;

        this.root.appendChild(Dom.create('div', { class: 'card' }, [
            Dom.create('h3', { text: 'Project Metadata' }),
            
            Dom.create('div', { class: 'mb-4' }, [
                Dom.create('label', { text: 'Story Title' }),
                Dom.create('input', { 
                    value: project.meta.title,
                    onInput: (e) => Store.updateConfig('title', e.target.value) // Note: Store needs updateMeta helper
                })
            ]),
            
            Dom.create('div', { class: 'mb-4' }, [
                Dom.create('label', { text: 'Start Scene ID' }),
                Dom.create('select', { 
                    value: project.config.startSceneId,
                    onChange: (e) => Store.updateConfig('startSceneId', e.target.value)
                }, Object.keys(project.scenes).map(id => Dom.create('option', { value: id, text: id })))
            ])
        ]));
    }
};

SettingsEditor.init();