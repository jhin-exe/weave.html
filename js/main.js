import { Store } from './data/Store.js';
import { Events } from './utils/Events.js';
import { Layout } from './editor/ui/Layout.js';

/**
 * Main.js
 */
class App {
    constructor() {
        this.init();
    }

    async init() {
        console.log("%c Weave.html %c v4.0 ", "background: #fff; color: #000; font-weight: bold; padding: 2px 4px;", "background: #333; color: #fff; padding: 2px 4px;");
        console.log("🚀 Initializing Engine...");

        // 1. Build the Skeleton (Layout)
        // MUST run this first. It creates the <div id="app"> structure,
        // the empty sidebar, and the tab containers.
        Layout.init();

        // 2. Load the Modules (Dynamic Imports)
        // CRITICAL: use dynamic imports here because these modules have
        // "auto-init" logic that tries to grab DOM elements immediately.
        // If imported statically at the top, they would run BEFORE Layout.init()
        // and crash because the DOM elements wouldn't exist yet.
        try {
            await Promise.all([
                // The Sidebar List
                import('./editor/ui/SceneList.js'),
                
                // The Editors (Tab Content)
                import('./editor/ui/editors/SceneEditor.js'),
                import('./editor/ui/editors/MapEditor.js'),
                
                // The Tools (Overlay & Logic)
                import('./editor/TestRunner.js'),
                import('./editor/Exporter.js')
            ]);
            console.log("✅ Modules Loaded");
        } catch (err) {
            console.error("❌ Failed to load editor modules:", err);
            // continue anyway, as the app might be partially usable
        }

        // 3. Boot the Data Store
        // Now that the UI modules are listening for events (like 'project:loaded'),
        // can safely initialize the Store. This will load data from localStorage
        // and fire the events that populate the UI just built.
        Store.init();

        // 4. Debugging Access
        // Expose the core systems to the console so you can manually inspect things.
        window.Weave = {
            Store,
            Events,
            Layout
        };
    }
}

// Start the application
window.app = new App();