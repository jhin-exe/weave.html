import { Events } from '../utils/Events.js';
import { ProjectModel } from './ProjectModel.js';
import { Id } from '../utils/Id.js';

class StoreManager {
    constructor() {
        this.project = null;
        this.activeSceneId = null;
    }

    init() {
        // Always start fresh on reload
        this.project = ProjectModel.create();
        this.activeSceneId = this.project.config.startSceneId;
        
        // Defer emission to ensure UI listeners are ready
        setTimeout(() => {
            Events.emit('project:loaded', this.project);
            Events.emit('scene:selected', this.activeSceneId);
        }, 0);
    }

    loadData(data) {
        this.project = data;
        this.activeSceneId = data.config.startSceneId;
        Events.emit('project:loaded', this.project);
        Events.emit('scene:selected', this.activeSceneId);
    }

    /* SCENE OPS */
    addScene() {
        const id = Id.generate('scene');
        this.project.scenes[id] = { id, text: "...", image: "", audio: "", choices: [] };
        Events.emit('project:updated');
        this.selectScene(id);
    }

    selectScene(id) {
        if (!this.project.scenes[id]) return;
        this.activeSceneId = id;
        Events.emit('scene:selected', id);
    }

    updateScene(id, field, value) {
        if (!this.project.scenes[id]) return;
        this.project.scenes[id][field] = value;
        Events.emit('scene:updated', { id, field, value });
    }

    renameScene(oldId, newId) {
        if (!newId || this.project.scenes[newId]) return alert("Invalid or existing ID.");
        this.project.scenes[newId] = this.project.scenes[oldId];
        this.project.scenes[newId].id = newId;
        delete this.project.scenes[oldId];
        
        Object.values(this.project.scenes).forEach(s => {
            s.choices.forEach(c => { if(c.target === oldId) c.target = newId; });
        });
        if(this.project.config.startSceneId === oldId) this.project.config.startSceneId = newId;
        
        this.activeSceneId = newId;
        Events.emit('project:loaded');
        this.selectScene(newId);
    }

    deleteScene(id) {
        delete this.project.scenes[id];
        Events.emit('project:loaded'); 
        Events.emit('scene:selected', null);
    }

    /* CHOICE OPS */
    addChoice(sceneId) {
        this.project.scenes[sceneId].choices.push({
            id: Id.generate('ch'), text: "Choice", target: sceneId, logicGroups: [], effects: []
        });
        Events.emit('scene:updated', { id: sceneId });
    }

    updateChoice(sceneId, index, field, value) {
        this.project.scenes[sceneId].choices[index][field] = value;
        Events.emit('scene:updated', { id: sceneId });
    }

    deleteChoice(sceneId, index) {
        this.project.scenes[sceneId].choices.splice(index, 1);
        Events.emit('scene:updated', { id: sceneId });
    }

    createLinkedScene(sceneId, choiceIndex) {
        const choice = this.project.scenes[sceneId].choices[choiceIndex];
        const newId = `${sceneId}_${choiceIndex + 1}`;
        
        if (this.project.scenes[newId]) return alert("Scene ID already exists.");
        
        this.project.scenes[newId] = { id: newId, text: "New branch...", image: "", audio: "", choices: [] };
        choice.target = newId;
        
        Events.emit('project:updated');
        this.selectScene(newId);
    }

    /* META OPS */
    updateTheme(k, v) { this.project.theme[k] = v; Events.emit('theme:updated'); }
    updateConfig(k, v) { this.project.config[k] = v; }
    
    // In-memory only, no localStorage calls
    save() { } 
    getProject() { return this.project; }
}

export const Store = new StoreManager();