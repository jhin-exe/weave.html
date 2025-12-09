import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';
import { TabManager } from '../TabManager.js';

/**
 * MapEditor.js
 * Visualizes the story flow as a node graph.
 * Handles auto-layout and basic interactivity.
 */
export const MapEditor = {
    init() {
        const container = TabManager.getContainer('map');
        
        // 1. Setup Canvas
        this.wrapper = Dom.create('div', { 
            class: 'w-full h-full relative overflow-hidden bg-zinc-950 cursor-grab',
            onMousedown: (e) => this.startPan(e)
        });
        
        // The moving canvas layer
        this.canvas = Dom.create('div', { 
            class: 'absolute origin-top-left transition-transform duration-75',
            style: { width: '3000px', height: '3000px', transform: 'translate(0px, 0px)' }
        });

        // SVG Layer for lines
        this.svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svgLayer.setAttribute("class", "absolute top-0 left-0 w-full h-full pointer-events-none z-0");
        
        // Nodes Layer
        this.nodeLayer = Dom.create('div', { class: 'absolute top-0 left-0 w-full h-full z-10' });

        this.canvas.appendChild(this.svgLayer);
        this.canvas.appendChild(this.nodeLayer);
        this.wrapper.appendChild(this.canvas);
        container.appendChild(this.wrapper);

        // State
        this.pan = { x: 0, y: 0, isDragging: false };
        this.nodes = {}; // Cache positions

        // Listeners
        Events.on('tab:changed', (id) => {
            if (id === 'map') this.render();
        });
        Events.on('project:updated', () => {
            if (TabManager.activeTab === 'map') this.render();
        });
    },

    startPan(e) {
        if (e.target.closest('.map-node')) return; // Don't pan if clicking a node
        this.pan.isDragging = true;
        this.pan.startX = e.clientX - this.pan.x;
        this.pan.startY = e.clientY - this.pan.y;
        this.wrapper.style.cursor = 'grabbing';
        
        const moveHandler = (ev) => {
            if (!this.pan.isDragging) return;
            this.pan.x = ev.clientX - this.pan.startX;
            this.pan.y = ev.clientY - this.pan.startY;
            this.canvas.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px)`;
        };

        const upHandler = () => {
            this.pan.isDragging = false;
            this.wrapper.style.cursor = 'grab';
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    },

    render() {
        Dom.clear(this.nodeLayer);
        Dom.clear(this.svgLayer);
        
        const project = Store.getProject();
        if (!project) return;
        
        // --- 1. Auto-Layout Algorithm (BFS Layering) ---
        const levels = {}; 
        const queue = [{ id: project.config.startSceneId, level: 0 }];
        const visited = new Set();
        const positions = {};

        // Calculate levels
        while(queue.length > 0) {
            const curr = queue.shift();
            if(visited.has(curr.id)) continue;
            visited.add(curr.id);
            levels[curr.id] = curr.level;
            
            const scene = project.scenes[curr.id];
            if(scene) {
                scene.choices.forEach(c => { 
                    if(project.scenes[c.target]) {
                        queue.push({ id: c.target, level: curr.level + 1 });
                    }
                });
            }
        }

        // Handle disconnected nodes
        Object.keys(project.scenes).forEach(id => {
            if (!visited.has(id)) levels[id] = 0; 
        });

        // Group by level
        const levelGroups = {};
        Object.entries(levels).forEach(([id, lvl]) => {
            if(!levelGroups[lvl]) levelGroups[lvl] = [];
            levelGroups[lvl].push(id);
        });

        // Assign Coordinates
        const NODE_W = 160;
        const NODE_H = 60;
        const GAP_X = 250;
        const GAP_Y = 100;
        const OFFSET_X = 100;
        const OFFSET_Y = 100;

        Object.keys(levelGroups).sort((a,b)=>a-b).forEach(lvl => {
            const group = levelGroups[lvl];
            group.forEach((id, idx) => {
                positions[id] = {
                    x: OFFSET_X + (lvl * GAP_X),
                    y: OFFSET_Y + (idx * GAP_Y)
                };
            });
        });

        // --- 2. Render Nodes ---
        Object.keys(positions).forEach(id => {
            const pos = positions[id];
            const isStart = id === project.config.startSceneId;
            
            const el = Dom.create('div', {
                class: `map-node absolute p-2 rounded border cursor-pointer hover:border-white transition-colors bg-zinc-900 ${isStart ? 'border-l-4 border-l-yellow-500' : 'border-zinc-700'}`,
                style: {
                    left: pos.x + 'px',
                    top: pos.y + 'px',
                    width: NODE_W + 'px',
                    height: NODE_H + 'px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                },
                onClick: (e) => {
                    e.stopPropagation(); // Prevent panning
                    Store.selectScene(id);
                    // Switch tab back to editor
                    // (Optional: TabManager.switch('scenes') - commented out to let user browse map freely)
                }
            }, [
                Dom.create('div', { text: id, class: 'font-mono font-bold text-xs truncate mb-1' }),
                Dom.create('div', { text: project.scenes[id].text.substring(0, 20) + '...', class: 'text-xs text-muted truncate' })
            ]);

            this.nodeLayer.appendChild(el);
        });

        // --- 3. Render Connections (Bezier Curves) ---
        Object.keys(project.scenes).forEach(id => {
            const scene = project.scenes[id];
            const p1 = positions[id];
            if(!p1) return;

            scene.choices.forEach(c => {
                const p2 = positions[c.target];
                if(p2) {
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    
                    const startX = p1.x + NODE_W;
                    const startY = p1.y + (NODE_H / 2);
                    const endX = p2.x;
                    const endY = p2.y + (NODE_H / 2);

                    const c1x = startX + 50;
                    const c2x = endX - 50;

                    path.setAttribute("d", `M ${startX} ${startY} C ${c1x} ${startY}, ${c2x} ${endY}, ${endX} ${endY}`);
                    path.setAttribute("fill", "none");
                    path.setAttribute("stroke", "#52525b");
                    path.setAttribute("stroke-width", "2");
                    
                    this.svgLayer.appendChild(path);
                }
            });
        });
    }
};

MapEditor.init();