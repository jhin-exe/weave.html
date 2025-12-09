import { Dom } from '../../utils/Dom.js';
import { TabManager } from './TabManager.js';

export const Layout = {
    init() {
        const app = document.getElementById('app');
        Dom.clear(app);

        // 1. Header (Matches your <header> block)
        const header = Dom.create('header', {}, [
            Dom.create('div', { class: 'brand' }, [
                // Minimal SVG Icon
                Dom.create('span', { text: 'WEAVE.HTML' }),
                Dom.create('span', { class: 'version-badge', text: 'v1.0' })
            ]),
            Dom.create('div', { class: 'flex gap-2' }, [
                Dom.create('button', { class: 'btn btn-play', text: '▶ Test', id: 'btn-test-game' }),
                Dom.create('div', { style: 'width:1px; background:var(--border); margin:0 5px;' }),
                Dom.create('button', { class: 'btn', text: 'Export', id: 'btn-export-game' })
            ])
        ]);

        // 2. Tab Navigation (Matches .nav-tabs)
        const tabNav = Dom.create('nav', { class: 'nav-tabs' });

        // 3. Mount to App
        app.appendChild(header);
        app.appendChild(tabNav);

        // 4. Initialize Tabs & Containers
        // This will create the .content-area divs matching your HTML
        TabManager.init(tabNav, app);
    }
};