import { Events } from '../utils/Events.js';
import { ProjectModel } from './ProjectModel.js';
import { Id } from '../utils/Id.js';

class StoreManager {
    constructor() {
        this.project = null;
        this.activeSceneId = null;
    }

    init() {
        this.project = ProjectModel.create();
        this.activeSceneId = this.project.config.startSceneId;
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

    // --- SCENES ---
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

    // --- CHOICES ---
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

    // --- LOGIC & EFFECTS (Restored from index.html) ---
    
    addLogicGroup(sid, idx) {
        const c = this.project.scenes[sid].choices[idx];
        if(!c.logicGroups) c.logicGroups = [];
        c.logicGroups.push([{type:'hasItem', key:'', val:''}]);
        Events.emit('scene:updated', { id: sid });
    }

    deleteLogicGroup(sid, cIdx, gIdx) {
        this.project.scenes[sid].choices[cIdx].logicGroups.splice(gIdx, 1);
        Events.emit('scene:updated', { id: sid });
    }

    addCondition(sid, idx, gIdx) {
        this.project.scenes[sid].choices[idx].logicGroups[gIdx].push({type:'hasItem', key:'', val:''});
        Events.emit('scene:updated', { id: sid });
    }

    updateCondition(sid, idx, gIdx, cIdx, field, val) {
        this.project.scenes[sid].choices[idx].logicGroups[gIdx][cIdx][field] = val;
        // No emit needed for every keystroke if we want, but safe to add
    }

    removeCondition(sid, idx, gIdx, cIdx) {
        const grp = this.project.scenes[sid].choices[idx].logicGroups[gIdx];
        grp.splice(cIdx, 1);
        if(grp.length === 0) this.project.scenes[sid].choices[idx].logicGroups.splice(gIdx, 1);
        Events.emit('scene:updated', { id: sid });
    }

    addEffect(sid, idx) {
        const c = this.project.scenes[sid].choices[idx];
        if(!c.effects) c.effects = [];
        c.effects.push({type:'varAdd', key:'', val:1});
        Events.emit('scene:updated', { id: sid });
    }

    updateEffect(sid, idx, eIdx, field, val) {
        this.project.scenes[sid].choices[idx].effects[eIdx][field] = val;
    }

    removeEffect(sid, idx, eIdx) {
        this.project.scenes[sid].choices[idx].effects.splice(eIdx, 1);
        Events.emit('scene:updated', { id: sid });
    }

    // --- META ---
    updateTheme(k, v) { this.project.theme[k] = v; Events.emit('theme:updated'); }
    updateConfig(k, v) { this.project.config[k] = v; }
    save() { }
    getProject() { return this.project; }
}

export const Store = new StoreManager();