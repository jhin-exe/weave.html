import { Parser } from './Parser.js';
import { AudioController } from './AudioController.js';

/**
 * Runtime.js
 * The core game engine. It maintains the game state (inventory, vars),
 * checks conditions, executes effects, and renders the output.
 * * It is designed to be attached to a specific DOM element (root).
 */
export class Runtime {
    constructor(rootElement) {
        this.root = rootElement;
        this.data = null; // The project JSON
        this.state = null; // { currentScene, inventory, variables }
        this.audio = new AudioController();
        
        // Callback hook for the editor to know when scene changes
        this.onSceneChange = null; 
    }

    /**
     * Initialize a game session.
     * @param {Object} projectData - The full project JSON.
     * @param {Object} [savedState=null] - Optional save data to load.
     */
    init(projectData, savedState = null) {
        this.data = projectData;
        
        if (savedState) {
            this.state = savedState;
        } else {
            this.state = {
                currentScene: this.data.config.startSceneId,
                inventory: [...this.data.items], // Copy initial items if any
                variables: { ...this.data.variables } // Copy initial vars
            };
        }

        this.render();
    }

    /**
     * Process a choice selection.
     * @param {number} choiceIndex - The index of the choice in the current scene.
     */
    choose(choiceIndex) {
        const scene = this.data.scenes[this.state.currentScene];
        if (!scene || !scene.choices[choiceIndex]) return;

        const choice = scene.choices[choiceIndex];

        // 1. Execute Effects
        this.executeEffects(choice.effects);

        // 2. Move to Target
        if (choice.target && this.data.scenes[choice.target]) {
            this.state.currentScene = choice.target;
            
            // Notify external listeners (Editor)
            if (this.onSceneChange) {
                this.onSceneChange(this.state.currentScene);
            }
        }

        this.render();
    }

    // --- LOGIC ENGINE ---

    /**
     * Check if a set of logic groups allows a choice to be shown.
     * Logic: (Group A AND ...) OR (Group B AND ...)
     * @param {Array} logicGroups 
     * @returns {boolean}
     */
    checkConditions(logicGroups) {
        // If no conditions, it's always visible
        if (!logicGroups || logicGroups.length === 0) return true;

        // OR Logic (At least one group must be true)
        return logicGroups.some(group => {
            // AND Logic (All conditions in this group must be true)
            return group.every(condition => {
                const { type, key, val } = condition;
                
                if (type === 'hasItem') {
                    return this.state.inventory.includes(key);
                }
                if (type === '!hasItem') {
                    return !this.state.inventory.includes(key);
                }

                // Numeric Variable Checks
                const currentVal = this.state.variables[key] || 0;
                const targetVal = parseFloat(val);

                if (type === 'varGT') return currentVal > targetVal; // Greater Than
                if (type === 'varLT') return currentVal < targetVal; // Less Than
                if (type === 'varEQ') return currentVal == targetVal; // Equal

                return false;
            });
        });
    }

    /**
     * Apply the effects of a choice.
     * @param {Array} effects 
     */
    executeEffects(effects) {
        if (!effects) return;

        effects.forEach(effect => {
            const { type, key, val } = effect;

            if (type === 'addItem') {
                if (!this.state.inventory.includes(key)) {
                    this.state.inventory.push(key);
                }
            } else if (type === 'remItem') {
                this.state.inventory = this.state.inventory.filter(i => i !== key);
            } else if (type === 'playSound') {
                this.audio.playSFX(key);
            } else {
                // Variable Math
                const currentVal = this.state.variables[key] || 0;
                const numVal = parseFloat(val);

                if (type === 'varSet') this.state.variables[key] = numVal;
                else if (type === 'varAdd') this.state.variables[key] = currentVal + numVal;
                else if (type === 'varSub') this.state.variables[key] = currentVal - numVal;
            }
        });
    }

    // --- RENDERER ---

    /**
     * Renders the current state to the root element.
     */
    render() {
        if (!this.root || !this.data) return;

        const sceneId = this.state.currentScene;
        const scene = this.data.scenes[sceneId];

        if (!scene) {
            this.root.innerHTML = `<div class="p-4 text-red-500">Error: Scene "${sceneId}" not found.</div>`;
            return;
        }

        // 1. Handle Audio
        this.audio.playBGM(scene.audio);

        // 2. Prepare Content
        const textHtml = Parser.parse(Parser.interpolate(scene.text, this.state.variables));
        const imageHtml = scene.image ? `<img src="${scene.image}" class="rt-image">` : '';

        // 3. Render Static Structure
        // Use innerHTML for the text body because it contains formatted HTML (b, i, etc.)
        this.root.innerHTML = `
            <div class="rt-container">
                ${imageHtml}
                <div class="rt-text">${textHtml}</div>
                <div class="rt-choices"></div>
            </div>
        `;

        // 4. Generate Buttons Programmatically
        // This avoids XSS issues with button text and makes event binding cleaner
        const choicesContainer = this.root.querySelector('.rt-choices');

        scene.choices.forEach((choice, index) => {
            if (this.checkConditions(choice.logicGroups)) {
                const btn = document.createElement('button');
                btn.className = 'rt-btn';
                btn.textContent = choice.text; // Safer than innerHTML
                
                // Direct binding - no need for data attributes or looking up elements later
                btn.onclick = () => this.choose(index);
                
                choicesContainer.appendChild(btn);
            }
        });
    }
}