import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { TabManager } from '../TabManager.js';
import { Events } from '../../../utils/Events.js';

export const SettingsEditor = {
    init() {
        const container = TabManager.getContainer('settings');
        this.mainPane = Dom.create('div', { class: 'main-pane' });
        this.root = Dom.create('div', { class: 'card', style: 'max-width:500px; margin:0 auto;' });
        
        this.mainPane.appendChild(this.root);
        container.appendChild(this.mainPane);
        
        Events.on('tab:changed', (id) => { if(id === 'settings') this.render(); });
    },

    render() {
        Dom.clear(this.root);
        const project = Store.getProject();
        if(!project) return;

        this.root.appendChild(Dom.create('h3', { text: 'Project Config' }));
        
        // Metadata inputs
        const addInput = (lbl, val, cb) => {
            const d = Dom.create('div', { style: 'margin-bottom:10px;' });
            d.appendChild(Dom.create('label', { text: lbl }));
            d.appendChild(Dom.create('input', { value: val, onInput: cb }));
            return d;
        };

        this.root.appendChild(addInput('Story Title', project.meta.title, (e) => Store.updateConfig('title', e.target.value)));
        this.root.appendChild(addInput('Author', project.meta.author, (e) => Store.updateConfig('author', e.target.value)));

        // Start Scene
        const startDiv = Dom.create('div', { style: 'margin-bottom:20px;' });
        startDiv.appendChild(Dom.create('label', { text: 'Starting Scene' }));
        startDiv.appendChild(Dom.create('select', { 
            value: project.config.startSceneId,
            onChange: (e) => Store.updateConfig('startSceneId', e.target.value)
        }, Object.keys(project.scenes).map(id => Dom.create('option', { value: id, text: id }))));
        this.root.appendChild(startDiv);

        // Mobile Opt
        const mobileDiv = Dom.create('div', { style: 'border-top:1px solid var(--border); padding-top:20px;' });
        const flex = Dom.create('div', { class: 'flex', style: 'align-items:center;' });
        flex.appendChild(Dom.create('input', { 
            type: 'checkbox', 
            checked: project.config.mobileOpt,
            onChange: (e) => Store.updateConfig('mobileOpt', e.target.checked)
        }));
        flex.appendChild(Dom.create('label', { text: 'Optimize Export for Mobile', style: 'margin:0; cursor:pointer;' }));
        mobileDiv.appendChild(flex);
        this.root.appendChild(mobileDiv);
    }
};
SettingsEditor.init();