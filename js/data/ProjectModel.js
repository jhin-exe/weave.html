import { Id } from '../utils/Id.js';

/**
 * ProjectModel.js
 * Defines the default structure (schema) for a new Weave project.
 * Acts as the "Single Source of Truth" for data integrity.
 */
export const ProjectModel = {
    /**
     * Creates a fresh, empty project structure.
     * @returns {Object} The default project object.
     */
    create() {
        const startSceneId = 'start';
        
        return {
            // Meta: Project information used for export and SEO
            meta: {
                title: "Untitled Story",
                author: "Anonymous",
                created: Date.now(),
                version: "1.0.0"
            },

            // Config: Runtime settings
            config: {
                startSceneId: startSceneId,
                mobileOpt: false // Optimize text/buttons for mobile export
            },

            // Theme: Visual styling for the exported game
            theme: {
                layout: "document", // document, card, terminal, cinematic
                bg: "#111111",
                text: "#eeeeee",
                accent: "#ffffff",
                border: "#333333",
                font: "Inter",
                customCss: ""
            },

            // State: Game logic variables
            variables: {
                // e.g., "gold": 10, "heroName": "Aria"
            },

            // Inventory: Items the player can hold
            items: [
                // { id: "sword", name: "Rusty Sword" }
            ],

            // Scenes: The core content nodes
            scenes: {
                [startSceneId]: {
                    id: startSceneId,
                    text: "The story begins here...",
                    image: "", // URL or relative path
                    audio: "", // URL or relative path
                    choices: [
                        {
                            id: Id.generate('ch'),
                            text: "Continue...",
                            target: startSceneId, // Loops back to self by default
                            logicGroups: [], // Conditions to show this choice
                            effects: []      // Actions when clicked (e.g., gold +10)
                        }
                    ]
                }
            }
        };
    }
};