import { Dom } from '../../utils/Dom.js';
import { TabManager } from './TabManager.js';
import { Store } from '../../data/Store.js';

/**
 * Layout.js
 * Constructs the main application shell (Header, Sidebar, Main View).
 * Acts as the UI entry point.
 */
export const Layout = {
    init() {
        const app = document.getElementById('app');
        Dom.clear(app); // Ensure clean slate

        // --- 1. Header ---
        const header = Dom.create('header', { class: 'app-header' }, [
            // Left: Brand
            Dom.create('div', { class: 'flex items-center gap-2' }, [
                Dom.create('span', { 
                    class: 'font-bold text-mono tracking-tight', 
                    style: { fontSize: '16px' },
                    text: 'WEAVE.HTML' 
                }),
                Dom.create('span', { 
                    class: 'text-xs px-1 border border-zinc-700 rounded text-muted',
                    text: 'v4.0'
                })
            ]),

            // Right: Global Actions
            Dom.create('div', { class: 'flex gap-2' }, [
                Dom.create('button', { 
                    class: 'btn btn-primary',
                    text: '▶ Test',
                    id: 'btn-test-game' // ID for TestRunner module to attach to later
                }),
                Dom.create('div', { class: 'w-px bg-zinc-700 mx-2 h-4 self-center' }),
                Dom.create('button', { 
                    class: 'btn', 
                    text: 'Export',
                    id: 'btn-export-game' // ID for Exporter module to attach to later
                })
            ])
        ]);

        // --- 2. Workspace (Sidebar + Main) ---
        const workspace = Dom.create('div', { class: 'app-workspace' });

        // Sidebar (Container Only)
        const sidebar = Dom.create('aside', { class: 'app-sidebar' }, [
            Dom.create('div', { class: 'p-2 border-b border-zinc-700' }, [
                Dom.create('button', {
                    class: 'btn w-full',
                    text: '+ New Scene',
                    onClick: () => Store.addScene()
                })
            ]),
            // The SceneList module will find this ID and populate it
            Dom.create('div', { 
                id: 'scene-list-container', 
                class: 'flex-1 scroll-y' 
            })
        ]);

        // Main Viewport
        const viewport = Dom.create('main', { class: 'app-viewport' });
        
        // Tab Navigation Bar
        const tabNav = Dom.create('nav', { class: 'tab-nav' });
        
        // Tab Content Area
        const tabContent = Dom.create('div', { class: 'flex-1 relative overflow-hidden bg-zinc-900' });

        // Assemble Viewport
        Dom.mount(tabNav, viewport);
        Dom.mount(tabContent, viewport);

        // Assemble Workspace
        Dom.mount(sidebar, workspace);
        Dom.mount(viewport, workspace);

        // Assemble App
        Dom.mount(header, app);
        Dom.mount(workspace, app);

        // --- 3. Initialize Tab System ---
        TabManager.init(tabNav, tabContent);
    }
};