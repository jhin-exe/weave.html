import { Events } from '../utils/Events.js';
import { ProjectModel } from './ProjectModel.js';
import { Id } from '../utils/Id.js';

class StoreManager {
    constructor() {
        this.project = null;
        this.activeSceneId = null;
        this.autoSaveKey = 'weave_autosave_v4';
    }

    init() {
        const saved = localStorage.getItem(this.autoSaveKey);
        if (saved) {
            try { this.project = JSON.parse(saved); } 
            catch (e) { this.project = ProjectModel.create(); }
        } else {
            this.project = ProjectModel.create();
        }
        this.activeSceneId = this.project.config.startSceneId;
        setTimeout(() => {
            Events.emit('project:loaded', this.project);
            Events.emit('scene:selected', this.activeSceneId);
        }, 0);
    }

    loadData(data) {
        this.project = data;
        this.activeSceneId = data.config.startSceneId;
        this.save();
        Events.emit('project:loaded', this.project);
        Events.emit('scene:selected', this.activeSceneId);
    }

    /* SCENE OPS */
    addScene() {
        const id = Id.generate('scene');
        this.project.scenes[id] = { id, text: "...", image: "", audio: "", choices: [] };
        this.save();
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
        this.save();
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
        this.save();
        Events.emit('project:loaded');
        this.selectScene(newId);
    }

    deleteScene(id) {
        delete this.project.scenes[id];
        this.save();
        Events.emit('project:loaded'); // Re-renders list
        Events.emit('scene:selected', null); // Clears editor
    }

    /* CHOICE OPS */
    addChoice(sceneId) {
        this.project.scenes[sceneId].choices.push({
            id: Id.generate('ch'), text: "Choice", target: sceneId, logicGroups: [], effects: []
        });
        this.save();
        Events.emit('scene:updated', { id: sceneId });
    }

    updateChoice(sceneId, index, field, value) {
        this.project.scenes[sceneId].choices[index][field] = value;
        this.save();
        Events.emit('scene:updated', { id: sceneId });
    }

    deleteChoice(sceneId, index) {
        this.project.scenes[sceneId].choices.splice(index, 1);
        this.save();
        Events.emit('scene:updated', { id: sceneId });
    }

    // RESTORED QoL FEATURE
    createLinkedScene(sceneId, choiceIndex) {
        const choice = this.project.scenes[sceneId].choices[choiceIndex];
        const newId = `${sceneId}_${choiceIndex + 1}`;
        
        if (this.project.scenes[newId]) return alert("Scene ID already exists.");
        
        this.project.scenes[newId] = { id: newId, text: "New branch...", image: "", audio: "", choices: [] };
        choice.target = newId;
        
        this.save();
        Events.emit('project:updated'); // Updates Map/List
        this.selectScene(newId); // Jumps to new scene
    }

    /* META OPS */
    updateTheme(k, v) { this.project.theme[k] = v; this.save(); Events.emit('theme:updated'); }
    updateConfig(k, v) { this.project.config[k] = v; this.save(); }
    
    save() { localStorage.setItem(this.autoSaveKey, JSON.stringify(this.project)); }
    getProject() { return this.project; }
}

export const Store = new StoreManager();