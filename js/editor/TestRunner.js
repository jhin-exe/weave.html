import { Dom } from '../utils/Dom.js';
import { Store } from '../data/Store.js';
import { Runtime } from '../core/Runtime.js';

export const TestRunner = {
    init() {
        const btn = document.getElementById('btn-test-game');
        if (btn) btn.onclick = () => this.start();
        
        this.createOverlay();

        // Safe global close function
        window.app = window.app || {};
        window.app.closeTest = () => this.close();
    },

    createOverlay() {
        if (document.getElementById('play-overlay')) return;
        
        const overlay = Dom.create('div', { id: 'play-overlay', class: 'hidden' }, [
            Dom.create('div', { class: 'play-bar' }, [
                Dom.create('button', {
                    class: 'btn btn-danger',
                    text: 'Close Test',
                    // We use the global reference to be safe against 'this' context loss
                    onClick: () => window.app.closeTest()
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

        const gameRoot = document.getElementById('rt-root-live');
        
        // CSS Vars
        gameRoot.style.setProperty('--rt-bg', project.theme.bg);
        gameRoot.style.setProperty('--rt-text', project.theme.text);
        gameRoot.style.setProperty('--rt-accent', project.theme.accent);
        gameRoot.style.setProperty('--rt-border', project.theme.border);
        gameRoot.style.setProperty('--rt-font', project.theme.font);
        gameRoot.className = `rt-root layout-${project.theme.layout}`;

        const runtime = new Runtime(gameRoot);
        const dataClone = JSON.parse(JSON.stringify(project));
        runtime.init(dataClone);
        
        this.activeRuntime = runtime;
        window.activeRuntime = runtime; 
    },

    close() {
        // Check if activeRuntime exists, then check if audio exists, THEN check if pause exists
        if (this.activeRuntime && this.activeRuntime.audio) {
            if (typeof this.activeRuntime.audio.pause === 'function') {
                this.activeRuntime.audio.pause();
            } else if (typeof this.activeRuntime.audio.stopBGM === 'function') {
                // If it's our AudioController wrapper
                this.activeRuntime.audio.stopBGM();
            }
            this.activeRuntime.audio = null;
        }
        
        const overlay = document.getElementById('play-overlay');
        if (overlay) overlay.classList.add('hidden');
        
        const root = document.getElementById('rt-root-live');
        if(root) root.innerHTML = '';
        
        window.activeRuntime = null;
        this.activeRuntime = null;
    }
};

setTimeout(() => TestRunner.init(), 100);