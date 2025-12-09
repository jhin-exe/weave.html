import { Store } from './data/Store.js';
import { Events } from './utils/Events.js';
import { Layout } from './editor/ui/Layout.js';

/**
 * Main.js
 * The Bootstrap.
 */
class App {
    constructor() {
        this.init();
    }

    async init() {
        console.log("%c Weave.html %c v4.0 ", "background: #fff; color: #000; font-weight: bold; padding: 2px 4px;", "background: #333; color: #fff; padding: 2px 4px;");
        console.log("🚀 Initializing Engine...");

        // 1. Build the Skeleton (Layout)
        Layout.init();

        // 2. Load ALL Modules
        try {
            await Promise.all([
                // The Sidebar List
                import('./editor/ui/SceneList.js'),
                
                // The Core Editors (Tab Content)
                import('./editor/ui/editors/SceneEditor.js'),
                import('./editor/ui/editors/MapEditor.js'),
                import('./editor/ui/editors/LogicEditor.js'),
                import('./editor/ui/editors/DesignEditor.js'),
                import('./editor/ui/editors/SettingsEditor.js'),
                
                // The Tools
                import('./editor/TestRunner.js'),
                import('./editor/Exporter.js')
            ]);
            console.log("✅ Modules Loaded");
        } catch (err) {
            console.error("❌ Failed to load editor modules:", err);
        }

        // 3. Boot the Data Store
        Store.init();

        // 4. Debugging Access
        window.Weave = { Store, Events, Layout };
    }
}

// Start the application
window.app = new App();