import { Parser } from './Parser.js';
import { AudioController } from './AudioController.js';

export class Runtime {
    constructor(rootElement) {
        this.root = rootElement;
        this.data = null;
        this.state = null;
        this.audio = new AudioController();
    }

    init(projectData, savedState = null) {
        this.data = projectData;
        if (savedState) {
            this.state = savedState;
        } else {
            this.state = {
                currentScene: this.data.config.startSceneId,
                inventory: [...this.data.items], 
                variables: { ...this.data.variables }
            };
            if(!Array.isArray(this.state.inventory)) this.state.inventory = [];
        }
        this.render();
    }

    // Methods called by the UI buttons
    saveGame() {
        const key = 'sf_save_' + this.data.meta.title;
        localStorage.setItem(key, JSON.stringify(this.state));
        alert('Saved!');
    }

    loadGame() {
        const key = 'sf_save_' + this.data.meta.title;
        const saved = localStorage.getItem(key);
        if (saved) {
            this.state = JSON.parse(saved);
            this.render();
        } else {
            alert('No save found.');
        }
    }

    resetGame() {
        if (this.audio) {
            this.audio.stopBGM(); 
        }
        // Re-init with clean state
        this.init(this.data);
    }

    // Main Game Loop
    choose(choiceIndex) {
        const scene = this.data.scenes[this.state.currentScene];
        if (!scene || !scene.choices[choiceIndex]) return;

        const choice = scene.choices[choiceIndex];
        this.executeEffects(choice.effects);

        if (choice.target && this.data.scenes[choice.target]) {
            this.state.currentScene = choice.target;
        }
        this.render();
    }

    checkConditions(logicGroups) {
        if (!logicGroups || logicGroups.length === 0) return true;
        return logicGroups.some(group => {
            return group.every(condition => {
                const { type, key, val } = condition;
                if (type === 'hasItem') return this.state.inventory.includes(key);
                if (type === '!hasItem') return !this.state.inventory.includes(key);
                
                const currentVal = this.state.variables[key] || 0;
                const targetVal = parseFloat(val);

                if (type === 'varGT') return currentVal > targetVal;
                if (type === 'varLT') return currentVal < targetVal;
                if (type === 'varEQ') return currentVal == targetVal;
                return false;
            });
        });
    }

    executeEffects(effects) {
        if (!effects) return;
        effects.forEach(effect => {
            const { type, key, val } = effect;
            if (type === 'addItem') {
                if (!this.state.inventory.includes(key)) this.state.inventory.push(key);
            } else if (type === 'remItem') {
                this.state.inventory = this.state.inventory.filter(i => i !== key);
            } else if (type === 'playSound') {
                this.audio.playSFX(key);
            } else {
                const currentVal = this.state.variables[key] || 0;
                const numVal = parseFloat(val);
                if (type === 'varSet') this.state.variables[key] = numVal;
                else if (type === 'varAdd') this.state.variables[key] = currentVal + numVal;
                else if (type === 'varSub') this.state.variables[key] = currentVal - numVal;
            }
        });
    }

    render() {
        if (!this.root || !this.data) return;
        const sceneId = this.state.currentScene;
        const scene = this.data.scenes[sceneId];

        if (!scene) {
            this.root.innerHTML = `<div class="rt-container"><div class="rt-text">Scene "${sceneId}" not found.</div></div>`;
            return;
        }

        this.audio.playBGM(scene.audio);

        const textHtml = Parser.parse(Parser.interpolate(scene.text, this.state.variables));
        const imageHtml = scene.image ? `<img src="${scene.image}" class="rt-image">` : '';

        // Generate Buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'rt-choices';
        
        scene.choices.forEach((choice, index) => {
            if (this.checkConditions(choice.logicGroups)) {
                const btn = document.createElement('button');
                btn.className = 'rt-btn';
                btn.innerHTML = choice.text; 
                btn.onclick = () => this.choose(index);
                buttonsContainer.appendChild(btn);
            }
        });

        const scanline = this.root.classList.contains('layout-terminal') ? '<div class="scanline"></div>' : '';

        // Build Full UI with System Buttons
        this.root.innerHTML = `
            ${scanline}
            <div class="rt-container">
                <div id="rt-out">
                    ${imageHtml}
                    <div class="rt-text">${textHtml}</div>
                </div>
            </div>
            <div class="rt-sys">
                <button class="rt-sys-btn" onclick="window.activeRuntime.saveGame()">Save</button>
                <button class="rt-sys-btn" onclick="window.activeRuntime.loadGame()">Load</button>
                <button class="rt-sys-btn" onclick="window.activeRuntime.resetGame()">Reset</button>
            </div>
        `;
        
        this.root.querySelector('#rt-out').appendChild(buttonsContainer);
    }
}