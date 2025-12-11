import { Store } from './data/Store.js';
import { Events } from './utils/Events.js';
import { Layout } from './editor/ui/Layout.js';

class App {
    constructor() {
        this.init();
    }

    async init() {
        console.log("%c Weave.html %c v4.0 ", "background: #fff; color: #000; font-weight: bold;", "background: #333; color: #fff;");
        
        Layout.init();

        try {
            await Promise.all([
                import('./editor/ui/SceneList.js'),
                import('./editor/ui/editors/SceneEditor.js'),
                import('./editor/ui/editors/MapEditor.js'),
                import('./editor/ui/editors/LogicEditor.js'),
                import('./editor/ui/editors/DesignEditor.js'),
                import('./editor/ui/editors/SettingsEditor.js'),
                import('./editor/ui/modals/QuickEditModal.js'), // NEW
                import('./editor/TestRunner.js'),
                import('./editor/Exporter.js')
            ]);
        } catch (err) {
            console.error("Failed load:", err);
        }

        Store.init();
        window.Weave = { Store, Events, Layout };
    }
}

window.app = new App();