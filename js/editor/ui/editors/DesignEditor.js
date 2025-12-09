import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';
import { TabManager } from '../TabManager.js';
import { Runtime } from '../../../core/Runtime.js';

export const DesignEditor = {
    init() {
        const container = TabManager.getContainer('design');
        
        // 1. Split Layout
        const split = Dom.create('div', { class: 'design-split' });
        
        // 2. Controls (Left)
        this.controls = Dom.create('div', { class: 'design-controls' });
        
        // 3. Preview (Right)
        const previewWrap = Dom.create('div', { class: 'design-preview' });
        const wrapInner = Dom.create('div', { class: 'preview-wrapper' });
        this.previewFrame = Dom.create('div', { id: 'preview-frame', class: 'rt-root' });
        
        wrapInner.appendChild(this.previewFrame);
        previewWrap.appendChild(wrapInner);
        
        split.appendChild(this.controls);
        split.appendChild(previewWrap);
        container.appendChild(split);

        Events.on('tab:changed', (id) => { 
            if(id === 'design') { this.renderControls(); this.renderPreview(); }
        });
        
        // Real-time update helper
        window.app = window.app || {};
        window.app.updateTheme = (k, v) => Store.updateTheme(k, v); 
    },

    renderControls() {
        Dom.clear(this.controls);
        const project = Store.getProject();
        if(!project) return;
        const t = project.theme;

        // Helper for Card
        const card = (label, content) => {
            const el = Dom.create('div', { class: 'card' });
            el.appendChild(Dom.create('label', { text: label }));
            content.forEach(c => el.appendChild(c));
            return el;
        };

        // Layout
        this.controls.appendChild(card('Layout Structure', [
            Dom.create('select', { 
                value: t.layout,
                onChange: (e) => { Store.updateTheme('layout', e.target.value); this.renderPreview(); }
            }, ['document', 'card', 'terminal', 'cinematic'].map(v => Dom.create('option', { value: v, text: v })))
        ]));

        // Colors
        this.controls.appendChild(card('Theme Colors', [
            Dom.create('div', { class: 'grid-2', style: 'grid-gap:10px;' }, [
                ['Background', 'bg'], ['Text', 'text'], ['Accent', 'accent'], ['Border', 'border']
            ].map(([lbl, key]) => Dom.create('div', {}, [
                Dom.create('label', { text: lbl, style: 'font-size:9px' }),
                Dom.create('input', { 
                    type: 'color', 
                    value: t[key], 
                    onInput: (e) => { Store.updateTheme(key, e.target.value); this.renderPreview(); }
                })
            ])))
        ]));

        // Font
        this.controls.appendChild(card('Typography', [
            Dom.create('select', { 
                value: t.font,
                onChange: (e) => { Store.updateTheme('font', e.target.value); this.renderPreview(); }
            }, ['Inter', 'JetBrains Mono', 'Merriweather', 'Orbitron', 'Creepster'].map(v => Dom.create('option', { value: v, text: v })))
        ]));
    },

    renderPreview() {
        const project = Store.getProject();
        // Inject CSS Vars
        this.previewFrame.style.setProperty('--rt-bg', project.theme.bg);
        this.previewFrame.style.setProperty('--rt-text', project.theme.text);
        this.previewFrame.style.setProperty('--rt-accent', project.theme.accent);
        this.previewFrame.style.setProperty('--rt-border', project.theme.border);
        this.previewFrame.style.setProperty('--rt-font', project.theme.font);
        this.previewFrame.className = `rt-root layout-${project.theme.layout}`;

        // Render Dummy Content
        const runtime = new Runtime(this.previewFrame);
        runtime.init(project);
    }
};
DesignEditor.init();