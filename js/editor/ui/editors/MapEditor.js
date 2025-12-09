import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';
import { TabManager } from '../TabManager.js';

export const MapEditor = {
    init() {
        const container = TabManager.getContainer('map');

        this.wrapper = Dom.create('div', { 
            class: 'w-full h-full relative overflow-hidden bg-zinc-950 cursor-grab',
            onMousedown: (e) => this.startPan(e)
        });
        
        this.canvas = Dom.create('div', { 
            class: 'absolute origin-top-left',
            style: { width: '3000px', height: '3000px', transform: 'translate(0px, 0px)', transition: 'transform 0.05s linear' }
        });

        this.svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svgLayer.setAttribute("class", "absolute top-0 left-0 w-full h-full pointer-events-none z-0");
        
        this.nodeLayer = Dom.create('div', { class: 'absolute top-0 left-0 w-full h-full z-10' });

        this.canvas.appendChild(this.svgLayer);
        this.canvas.appendChild(this.nodeLayer);
        this.wrapper.appendChild(this.canvas);
        container.appendChild(this.wrapper);

        this.pan = { x: 0, y: 0, isDragging: false };

        Events.on('tab:changed', (id) => { if (id === 'map') this.render(); });
        Events.on('project:updated', () => { if (TabManager.activeTab === 'map') this.render(); });
    },

    startPan(e) {
        if (e.target.closest('.map-node')) return;
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
        
        // Simple Auto-Layout (BFS)
        const levels = {}; 
        const queue = [{ id: project.config.startSceneId, level: 0 }];
        const visited = new Set();
        const positions = {};

        while(queue.length > 0) {
            const curr = queue.shift();
            if(visited.has(curr.id)) continue;
            visited.add(curr.id);
            levels[curr.id] = curr.level;
            project.scenes[curr.id].choices.forEach(c => { 
                if(project.scenes[c.target]) queue.push({ id: c.target, level: curr.level + 1 });
            });
        }
        Object.keys(project.scenes).forEach(id => { if (!visited.has(id)) levels[id] = 0; });

        const levelGroups = {};
        Object.entries(levels).forEach(([id, lvl]) => {
            if(!levelGroups[lvl]) levelGroups[lvl] = [];
            levelGroups[lvl].push(id);
        });

        Object.keys(levelGroups).sort((a,b)=>a-b).forEach(lvl => {
            levelGroups[lvl].forEach((id, idx) => {
                positions[id] = { x: 100 + (lvl * 250), y: 100 + (idx * 120) };
            });
        });

        // Draw Nodes
        Object.keys(positions).forEach(id => {
            const pos = positions[id];
            const isStart = id === project.config.startSceneId;
            const el = Dom.create('div', {
                class: `map-node absolute p-2 rounded border cursor-pointer bg-zinc-900 ${isStart ? 'border-l-4 border-l-yellow-500' : 'border-zinc-700'}`,
                style: { left: pos.x + 'px', top: pos.y + 'px', width: '160px', height: '60px' },
                onClick: (e) => { e.stopPropagation(); Store.selectScene(id); }
            }, [
                Dom.create('div', { text: id, class: 'font-bold text-xs truncate' }),
                Dom.create('div', { text: project.scenes[id].text.substring(0,15)+'...', class: 'text-xs text-muted' })
            ]);
            this.nodeLayer.appendChild(el);
        });

        // Draw Lines
        Object.keys(project.scenes).forEach(id => {
            const p1 = positions[id];
            if(!p1) return;
            project.scenes[id].choices.forEach(c => {
                const p2 = positions[c.target];
                if(p2) {
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    const startX = p1.x + 160, startY = p1.y + 30, endX = p2.x, endY = p2.y + 30;
                    path.setAttribute("d", `M ${startX} ${startY} C ${startX+50} ${startY}, ${endX-50} ${endY}, ${endX} ${endY}`);
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