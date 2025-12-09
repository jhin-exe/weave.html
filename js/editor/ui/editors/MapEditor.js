import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';
import { TabManager } from '../TabManager.js';

export const MapEditor = {
    init() {
        const container = TabManager.getContainer('map');
        
        // 1. Recreate your HTML structure exactly
        this.mapContainer = Dom.create('div', { id: 'map-container' });
        this.mapCanvas = Dom.create('div', { id: 'map-canvas' });
        this.svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svgLayer.setAttribute("id", "map-svg");
        this.svgLayer.setAttribute("class", "map-svg");
        this.nodesLayer = Dom.create('div', { id: 'map-nodes' });

        this.mapCanvas.appendChild(this.svgLayer);
        this.mapCanvas.appendChild(this.nodesLayer);
        this.mapContainer.appendChild(this.mapCanvas);
        container.appendChild(this.mapContainer);

        // 2. Init Panning Logic (Your exact logic)
        this.initPan();

        Events.on('tab:changed', (id) => { if(id === 'map') this.render(); });
        Events.on('project:updated', () => { if(TabManager.activeTab === 'map') this.render(); });
    },

    initPan() {
        let isDown = false, startX, startY, scrollLeft, scrollTop;
        const cont = this.mapContainer;

        cont.addEventListener('mousedown', (e) => {
            if(e.target.classList.contains('map-node')) return;
            isDown = true; 
            cont.style.cursor = 'grabbing';
            startX = e.pageX - cont.offsetLeft;
            startY = e.pageY - cont.offsetTop;
            scrollLeft = cont.scrollLeft;
            scrollTop = cont.scrollTop;
        });
        
        const stop = () => { isDown = false; cont.style.cursor = 'grab'; };
        cont.addEventListener('mouseleave', stop);
        cont.addEventListener('mouseup', stop);
        
        cont.addEventListener('mousemove', (e) => {
            if(!isDown) return;
            e.preventDefault();
            const x = e.pageX - cont.offsetLeft;
            const y = e.pageY - cont.offsetTop;
            const walkX = (x - startX);
            const walkY = (y - startY);
            cont.scrollLeft = scrollLeft - walkX;
            cont.scrollTop = scrollTop - walkY;
        });
    },

    render() {
        Dom.clear(this.nodesLayer);
        Dom.clear(this.svgLayer);
        const project = Store.getProject();
        if(!project) return;

        // BFS Layout Algorithm
        const levels = {}; 
        const queue = [{ id: project.config.startSceneId, level: 0 }];
        const visited = new Set();
        
        while(queue.length > 0) {
            const curr = queue.shift();
            if(visited.has(curr.id)) continue;
            visited.add(curr.id);
            levels[curr.id] = curr.level;
            
            project.scenes[curr.id].choices.forEach(c => { 
                if(project.scenes[c.target]) queue.push({ id: c.target, level: curr.level + 1 });
            });
        }
        Object.keys(project.scenes).forEach(id => { if(!visited.has(id)) levels[id] = 0; });

        const levelGroups = {};
        Object.entries(levels).forEach(([id, lvl]) => {
            if(!levelGroups[lvl]) levelGroups[lvl] = [];
            levelGroups[lvl].push(id);
        });

        const positions = {};
        const xGap = 220, yGap = 80;

        Object.keys(levelGroups).sort((a,b)=>a-b).forEach(lvl => {
            const group = levelGroups[lvl];
            group.forEach((id, idx) => {
                const x = 50 + (lvl * xGap);
                const y = 50 + (idx * yGap);
                positions[id] = { x, y };

                const el = Dom.create('div', {
                    class: `map-node ${id === project.config.startSceneId ? 'start-node' : ''}`,
                    id: `node-${id}`,
                    text: id,
                    style: { left: x + 'px', top: y + 'px' },
                    onClick: () => Store.selectScene(id) 
                });
                this.nodesLayer.appendChild(el);
            });
        });

        // Draw Links
        Object.keys(project.scenes).forEach(id => {
            const p1 = positions[id];
            if(!p1) return;
            project.scenes[id].choices.forEach(c => {
                const p2 = positions[c.target];
                if(p2) {
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("class", "map-path");
                    const startX = p1.x + 140, startY = p1.y + 20;  
                    const endX = p2.x, endY = p2.y + 20;
                    path.setAttribute("d", `M ${startX} ${startY} C ${startX+50} ${startY}, ${endX-50} ${endY}, ${endX} ${endY}`);
                    this.svgLayer.appendChild(path);
                }
            });
        });
    }
};
MapEditor.init();