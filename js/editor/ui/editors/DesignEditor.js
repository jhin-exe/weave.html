import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';
import { TabManager } from '../TabManager.js';
import { Runtime } from '../../../core/Runtime.js';

export const DesignEditor = {
    init() {
        const container = TabManager.getContainer('design');
        
        // Split View: Controls (Left) - Preview (Right)
        const split = Dom.create('div', { class: 'editor-split' });
        
        // Controls
        this.controls = Dom.create('div', { class: 'editor-sidebar p-4 scroll-y', style: { width: '350px' } });
        
        // Preview Area
        const previewWrapper = Dom.create('div', { class: 'editor-main bg-black p-0 flex flex-col' });
        this.previewFrame = Dom.create('div', { class: 'w-full h-full relative' });
        
        previewWrapper.appendChild(this.previewFrame);
        split.appendChild(this.controls);
        split.appendChild(previewWrapper);
        container.appendChild(split);

        Events.on('tab:changed', (id) => { 
            if(id === 'design') {
                this.renderControls();
                this.renderPreview();
            }
        });
        
        // Real-time update on theme change
        Events.on('theme:updated', () => this.renderPreview());
    },

    renderControls() {
        Dom.clear(this.controls);
        const project = Store.getProject();
        if(!project) return;
        const t = project.theme;

        const makeColor = (label, key) => Dom.create('div', { class: 'mb-2' }, [
            Dom.create('label', { text: label }),
            Dom.create('input', { 
                type: 'color', 
                value: t[key], 
                style: { height: '40px' },
                onInput: (e) => Store.updateTheme(key, e.target.value)
            })
        ]);

        this.controls.appendChild(Dom.create('div', { class: 'card' }, [
            Dom.create('label', { text: 'Layout' }),
            Dom.create('select', { 
                value: t.layout,
                onChange: (e) => Store.updateTheme('layout', e.target.value) 
            }, [
                Dom.create('option', { value: 'document', text: 'Document' }),
                Dom.create('option', { value: 'card', text: 'Card' }),
                Dom.create('option', { value: 'terminal', text: 'Terminal' }),
                Dom.create('option', { value: 'cinematic', text: 'Cinematic' }),
            ])
        ]));

        this.controls.appendChild(Dom.create('div', { class: 'card' }, [
            makeColor('Background', 'bg'),
            makeColor('Text', 'text'),
            makeColor('Accent', 'accent'),
            makeColor('Border', 'border')
        ]));

        this.controls.appendChild(Dom.create('div', { class: 'card' }, [
            Dom.create('label', { text: 'Font' }),
            Dom.create('select', { 
                value: t.font,
                onChange: (e) => Store.updateTheme('font', e.target.value) 
            }, [
                Dom.create('option', { value: 'Inter', text: 'Inter' }),
                Dom.create('option', { value: 'JetBrains Mono', text: 'JetBrains Mono' }),
                Dom.create('option', { value: 'Merriweather', text: 'Merriweather' }),
            ])
        ]));
    },

    renderPreview() {
        Dom.clear(this.previewFrame);
        const project = Store.getProject();
        
        // We reuse the Runtime class to render the preview
        // We need to inject the CSS variables onto the container
        this.previewFrame.style.setProperty('--rt-bg', project.theme.bg);
        this.previewFrame.style.setProperty('--rt-text', project.theme.text);
        this.previewFrame.style.setProperty('--rt-accent', project.theme.accent);
        this.previewFrame.style.setProperty('--rt-border', project.theme.border);
        this.previewFrame.style.setProperty('--rt-font', project.theme.font);
        
        this.previewFrame.className = `rt-root layout-${project.theme.layout}`;

        const runtime = new Runtime(this.previewFrame);
        runtime.init(project);
    }
};

DesignEditor.init();