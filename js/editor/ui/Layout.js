import { Dom } from '../../utils/Dom.js';
import { TabManager } from './TabManager.js';
import { FileIO } from '../../utils/FileIO.js';

export const Layout = {
    init() {
        const app = document.getElementById('app');
        Dom.clear(app);

        // 1. Header
        const header = Dom.create('header', {}, [
            Dom.create('div', { class: 'brand' }, [
                Dom.create('span', { text: 'STORYFORGE' }),
                Dom.create('span', { class: 'version-badge', text: 'v4.0' })
            ]),
            Dom.create('div', { class: 'flex gap-2' }, [
                Dom.create('button', { class: 'btn btn-play', text: '▶ Test', id: 'btn-test-game' }),
                Dom.create('div', { style: 'width:1px; background:var(--border); margin:0 5px;' }),
                
                // RESTORED BUTTONS
                Dom.create('button', { class: 'btn', text: 'Open', onClick: () => FileIO.triggerOpen() }),
                Dom.create('button', { class: 'btn', text: 'Save', onClick: () => FileIO.saveProject() }),
                
                Dom.create('button', { class: 'btn btn-primary', text: 'Export', id: 'btn-export-game' })
            ])
        ]);

        // 2. Tab Navigation
        const tabNav = Dom.create('nav', { class: 'nav-tabs' });

        app.appendChild(header);
        app.appendChild(tabNav);

        TabManager.init(tabNav, app);
    }
};