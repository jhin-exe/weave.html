import { Events } from '../utils/Events.js';
import { ProjectModel } from './ProjectModel.js';
import { Id } from '../utils/Id.js';

/**
 * Store.js
 * The Central Nervous System.
 * Manages the project state, handles mutations, and persists data.
 */
class StoreManager {
    constructor() {
        this.project = null;
        this.activeSceneId = null;
        this.autoSaveKey = 'weave_autosave_v1';
    }

    /**
     * Initialize the Store.
     * Tries to load autosave, otherwise creates a new project.
     */
    init() {
        const saved = localStorage.getItem(this.autoSaveKey);
        if (saved) {
            try {
                this.project = JSON.parse(saved);
                console.log('📦 [Store] Loaded from Autosave');
            } catch (e) {
                console.error('⚠️ [Store] Corrupt save file, resetting.', e);
                this.project = ProjectModel.create();
            }
        } else {
            this.project = ProjectModel.create();
            console.log('✨ [Store] Created New Project');
        }

        // Set initial active scene
        this.activeSceneId = this.project.config.startSceneId;
        
        // Notify the app that data is ready
        // We defer this slightly to ensure all listeners are attached
        setTimeout(() => {
            Events.emit('project:loaded', this.project);
            Events.emit('scene:selected', this.activeSceneId);
        }, 0);
    }

    // --- SCENE OPERATIONS ---

    /**
     * Create a new empty scene and switch to it.
     */
    addScene() {
        const id = Id.generate('scene');
        const newScene = {
            id: id,
            text: "...",
            image: "",
            audio: "",
            choices: []
        };

        this.project.scenes[id] = newScene;
        this.save();
        
        Events.emit('project:updated', this.project);
        this.selectScene(id);
    }

    /**
     * Select a scene to edit.
     * @param {string} id 
     */
    selectScene(id) {
        if (!this.project.scenes[id]) return;
        this.activeSceneId = id;
        Events.emit('scene:selected', id);
    }

    /**
     * Update a specific field of a scene.
     * @param {string} id - Scene ID
     * @param {string} field - Field name (text, image, etc)
     * @param {*} value - New value
     */
    updateScene(id, field, value) {
        if (!this.project.scenes[id]) return;
        this.project.scenes[id][field] = value;
        this.save();
        Events.emit('scene:updated', { id, field, value });
    }

    /**
     * Rename a scene ID (refactors all links pointing to it).
     * @param {string} oldId 
     * @param {string} newId 
     */
    renameScene(oldId, newId) {
        if (this.project.scenes[newId]) {
            alert('Scene ID already exists!');
            return;
        }

        const scene = this.project.scenes[oldId];
        scene.id = newId;
        this.project.scenes[newId] = scene;
        delete this.project.scenes[oldId];

        // Refactor links in other scenes
        Object.values(this.project.scenes).forEach(s => {
            s.choices.forEach(c => {
                if (c.target === oldId) c.target = newId;
            });
        });

        // Update config if needed
        if (this.project.config.startSceneId === oldId) {
            this.project.config.startSceneId = newId;
        }

        this.activeSceneId = newId;
        this.save();
        
        // Full refresh needed for ID changes
        Events.emit('project:loaded', this.project); 
        Events.emit('scene:selected', newId);
    }

    deleteScene(id) {
        if (Object.keys(this.project.scenes).length <= 1) {
            alert("Cannot delete the last scene.");
            return;
        }
        
        delete this.project.scenes[id];
        
        // If we deleted the active scene, pick a random one to show
        if (this.activeSceneId === id) {
            this.activeSceneId = Object.keys(this.project.scenes)[0];
        }

        this.save();
        Events.emit('project:loaded', this.project); // Refresh list
        Events.emit('scene:selected', this.activeSceneId);
    }

    // --- CHOICE OPERATIONS ---

    addChoice(sceneId) {
        const scene = this.project.scenes[sceneId];
        if (!scene) return;

        scene.choices.push({
            id: Id.generate('ch'),
            text: "New Choice",
            target: sceneId,
            logicGroups: [],
            effects: []
        });

        this.save();
        Events.emit('scene:updated', { id: sceneId });
    }

    updateChoice(sceneId, choiceIndex, field, value) {
        const scene = this.project.scenes[sceneId];
        if (!scene || !scene.choices[choiceIndex]) return;

        scene.choices[choiceIndex][field] = value;
        this.save();
        Events.emit('scene:updated', { id: sceneId });
    }

    deleteChoice(sceneId, choiceIndex) {
        const scene = this.project.scenes[sceneId];
        if (!scene) return;

        scene.choices.splice(choiceIndex, 1);
        this.save();
        Events.emit('scene:updated', { id: sceneId });
    }

    // --- META OPERATIONS ---

    updateTheme(field, value) {
        this.project.theme[field] = value;
        this.save();
        Events.emit('theme:updated', this.project.theme);
    }

    updateConfig(field, value) {
        this.project.config[field] = value;
        this.save();
    }

    // --- PERSISTENCE ---

    save() {
        // Debounce could be added here for performance
        localStorage.setItem(this.autoSaveKey, JSON.stringify(this.project));
    }
    
    getProject() {
        return this.project;
    }
}

export const Store = new StoreManager();