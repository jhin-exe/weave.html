import { Dom } from '../utils/Dom.js';
import { Store } from '../data/Store.js';
import { Runtime } from '../core/Runtime.js';

export const TestRunner = {
    init() {
        const btn = document.getElementById('btn-test-game');
        if (btn) btn.onclick = () => this.start();
        
        // Ensure overlay exists
        this.createOverlay();
    },

    createOverlay() {
        if (document.getElementById('play-overlay')) return;
        
        const overlay = Dom.create('div', { id: 'play-overlay', class: 'hidden' }, [
            Dom.create('div', { class: 'play-bar' }, [
                Dom.create('button', {
                    class: 'btn btn-danger',
                    text: 'Close Test',
                    // Direct binding avoids scope issues
                    onClick: () => this.close()
                })
            ]),
            Dom.create('div', { class: 'preview-wrapper' }, [
                Dom.create('div', { id: 'rt-root-live', class: 'rt-root' })
            ])
        ]);
        document.body.appendChild(overlay);
    },

    start() {
        const project = Store.getProject();
        if (!project) return;

        const overlay = document.getElementById('play-overlay');
        overlay.classList.remove('hidden');

        // Setup Runtime Container
        const gameRoot = document.getElementById('rt-root-live');
        
        // Inject Theme Vars
        gameRoot.style.setProperty('--rt-bg', project.theme.bg);
        gameRoot.style.setProperty('--rt-text', project.theme.text);
        gameRoot.style.setProperty('--rt-accent', project.theme.accent);
        gameRoot.style.setProperty('--rt-border', project.theme.border);
        gameRoot.style.setProperty('--rt-font', project.theme.font);
        
        // Important: This class triggers the layout specific CSS rules we just fixed
        gameRoot.className = `rt-root layout-${project.theme.layout}`;

        // Initialize Runtime
        const runtime = new Runtime(gameRoot);
        const dataClone = JSON.parse(JSON.stringify(project));
        runtime.init(dataClone);
        
        this.activeRuntime = runtime;
        
        // Expose for the inline onclick handlers in Runtime.render() buttons
        window.activeRuntime = runtime; 
    },

    close() {
        if (this.activeRuntime && this.activeRuntime.audio) {
            this.activeRuntime.audio.pause();
            this.activeRuntime.audio = null;
        }
        
        const overlay = document.getElementById('play-overlay');
        if (overlay) overlay.classList.add('hidden');
        
        const root = document.getElementById('rt-root-live');
        if(root) root.innerHTML = '';
        
        window.activeRuntime = null;
    }
};

setTimeout(() => TestRunner.init(), 100);