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
                inventory: [...this.data.items], // Start with default items if any logic existed there
                variables: { ...this.data.variables }
            };
            // Fix: ensure inventory is array if it came from legacy data
            if(!Array.isArray(this.state.inventory)) this.state.inventory = [];
        }
        this.render();
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
                btn.innerHTML = choice.text; // InnerHTML allowed here for simple text formatting
                btn.onclick = () => this.choose(index);
                buttonsContainer.appendChild(btn);
            }
        });

        // Scanline for terminal theme
        const scanline = this.root.classList.contains('layout-terminal') ? '<div class="scanline"></div>' : '';

        // Build Full UI
        this.root.innerHTML = `
            ${scanline}
            <div class="rt-container">
                <div id="rt-out">
                    ${imageHtml}
                    <div class="rt-text">${textHtml}</div>
                </div>
            </div>
            <div class="rt-sys">
                <button class="rt-sys-btn" onclick="alert('Save not implemented in test mode')">Save</button>
                <button class="rt-sys-btn" onclick="alert('Load not implemented in test mode')">Load</button>
                <button class="rt-sys-btn" onclick="window.activeRuntime.init(window.activeRuntime.data)">Reset</button>
            </div>
        `;
        
        // Append buttons manually to preserve events
        this.root.querySelector('#rt-out').appendChild(buttonsContainer);
    }
}