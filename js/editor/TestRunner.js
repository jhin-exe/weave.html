import { Dom } from '../utils/Dom.js';
import { Store } from '../data/Store.js';
import { Runtime } from '../core/Runtime.js';

/**
 * TestRunner.js
 * Handles the "Test Game" overlay.
 * It creates a temporary runtime instance using the current project data.
 */
export const TestRunner = {
    init() {
        const btn = document.getElementById('btn-test-game');
        if (btn) btn.onclick = () => this.start();
    },

    start() {
        const project = Store.getProject();
        if (!project) return;

        // 1. Create Overlay
        this.overlay = Dom.create('div', {
            class: 'fixed inset-0 z-50 bg-black flex flex-col',
            style: { animation: 'fadeIn 0.2s ease' }
        });

        // 2. Toolbar
        const toolbar = Dom.create('div', { 
            class: 'flex justify-end p-2 bg-zinc-900 border-b border-zinc-800' 
        }, [
            Dom.create('button', {
                class: 'btn btn-danger',
                text: 'Close Test',
                onClick: () => this.close()
            })
        ]);

        // 3. Game Container
        // We reuse the theme classes from the project to match the export look
        const gameRoot = Dom.create('div', { 
            class: `rt-root layout-${project.theme.layout}`,
            style: { 
                flex: '1', 
                overflowY: 'auto',
                // Inject CSS vars for preview
                '--rt-bg': project.theme.bg,
                '--rt-text': project.theme.text,
                '--rt-accent': project.theme.accent,
                '--rt-border': project.theme.border,
                '--rt-font': project.theme.font
            }
        });

        this.overlay.appendChild(toolbar);
        this.overlay.appendChild(gameRoot);
        document.body.appendChild(this.overlay);

        // 4. Initialize Runtime
        // We pass a clone of the data so the test session doesn't mutate the editor data
        const runtime = new Runtime(gameRoot);
        const dataClone = JSON.parse(JSON.stringify(project));
        runtime.init(dataClone);
        
        // 5. Handle Audio Cleanup
        this.activeRuntime = runtime;
    },

    close() {
        if (this.activeRuntime && this.activeRuntime.audio) {
            this.activeRuntime.audio.stopBGM();
        }
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
};

// Hook up button immediately
// Note: use a timeout to ensure the DOM button exists if this script loads fast
setTimeout(() => TestRunner.init(), 100);