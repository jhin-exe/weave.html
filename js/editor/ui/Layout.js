import { Dom } from '../../utils/Dom.js';
import { TabManager } from './TabManager.js';

/**
 * Layout.js
 */
export const Layout = {
    init() {
        const app = document.getElementById('app');
        Dom.clear(app);

        // 1. Header
        const header = Dom.create('header', { class: 'app-header' }, [
            Dom.create('div', { class: 'flex items-center gap-2' }, [
                Dom.create('span', { 
                    class: 'font-bold text-mono', 
                    style: { fontSize: '16px' },
                    text: 'STORYFORGE' // Restored name preference? or Weave? Kept simple.
                }),
                Dom.create('span', { 
                    class: 'text-xs px-1 border border-zinc-700 rounded text-muted',
                    text: 'v4.0'
                })
            ]),
            Dom.create('div', { class: 'flex gap-2' }, [
                Dom.create('button', { class: 'btn btn-primary', text: '▶ Test', id: 'btn-test-game' }),
                Dom.create('div', { class: 'w-px bg-zinc-700 mx-2 h-4 self-center' }),
                Dom.create('button', { class: 'btn', text: 'Export', id: 'btn-export-game' })
            ])
        ]);

        // 2. Workspace
        const workspace = Dom.create('div', { class: 'app-workspace' });
        
        // Tab Nav
        const tabNav = Dom.create('nav', { class: 'tab-nav' });
        
        // Main Content Area (Where SceneEditor, MapEditor, etc. live)
        const tabContent = Dom.create('div', { class: 'tab-content-area' });

        Dom.mount(tabNav, workspace);
        Dom.mount(tabContent, workspace);
        Dom.mount(header, app);
        Dom.mount(workspace, app);

        // 3. Init Tabs
        TabManager.init(tabNav, tabContent);
    }
};