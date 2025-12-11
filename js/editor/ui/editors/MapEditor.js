import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';
import { TabManager } from '../TabManager.js';
import { QuickEditModal } from '../modals/QuickEditModal.js';
import { ChoiceModal } from '../modals/ChoiceModal.js';

export const MapEditor = {
    init() {
        const container = TabManager.getContainer('map');
        
        this.mapContainer = Dom.create('div', { id: 'map-container' });
        this.mapCanvas = Dom.create('div', { id: 'map-canvas' });
        
        this.svgLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svgLayer.setAttribute("id", "map-svg");
        
        this.nodesLayer = Dom.create('div', { id: 'map-nodes' });

        this.mapCanvas.appendChild(this.svgLayer);
        this.mapCanvas.appendChild(this.nodesLayer);
        this.mapContainer.appendChild(this.mapCanvas);
        container.appendChild(this.mapContainer);

        // Map Tool Bar (Inside map container)
        const toolbar = Dom.create('div', { 
            style: 'position:absolute; top:20px; left:20px; z-index:20;' 
        }, [
            Dom.create('button', { 
                class: 'btn btn-primary btn-sm', 
                text: '+ Add Scene', 
                onClick: () => Store.addScene() 
            })
        ]);
        this.mapContainer.appendChild(toolbar);

        this.state = {
            dragging: null,
            linking: null,
            panning: false,
            startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0
        };

        this.bindEvents();

        Events.on('tab:changed', (id) => { if(id === 'map') this.render(); });
        Events.on('project:updated', () => { if(TabManager.activeTab === 'map') this.render(); });
    },

    bindEvents() {
        const c = this.mapContainer;

        c.addEventListener('mousedown', (e) => {
            // 1. Check for Link Handle
            if (e.target.classList.contains('link-handle')) {
                this.startLinking(e);
                return;
            }
            // 2. Check for Node Body (Left Click = Drag/Edit, Right = Trace)
            const node = e.target.closest('.map-node');
            if (node) {
                if (e.button === 0) this.startDrag(e, node);
                return;
            }
            // 3. Background Pan
            this.startPan(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.state.dragging) this.updateDrag(e);
            if (this.state.linking) this.updateLink(e);
            if (this.state.panning) this.updatePan(e);
        });

        document.addEventListener('mouseup', (e) => {
            if (this.state.dragging) this.stopDrag(e);
            if (this.state.linking) this.stopLinking(e);
            if (this.state.panning) this.stopPan();
        });
    },

    // --- NODE DRAGGING ---
    startDrag(e, nodeEl) {
        e.stopPropagation();
        this.state.dragging = {
            id: nodeEl.dataset.id,
            el: nodeEl,
            offX: e.clientX - nodeEl.getBoundingClientRect().left,
            offY: e.clientY - nodeEl.getBoundingClientRect().top,
            moved: false
        };
        nodeEl.style.zIndex = 100;
        QuickEditModal.hide(); 
    },
    updateDrag(e) {
        const s = this.state.dragging;
        s.moved = true;
        
        const rect = this.mapCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left - s.offX;
        const y = e.clientY - rect.top - s.offY;
        
        s.el.style.left = x + 'px';
        s.el.style.top = y + 'px';
        
        // Update connections live (optional optimization: skip this for perf)
        // For now, let's just move the node.
    },
    stopDrag(e) {
        const s = this.state.dragging;
        if (!s) return;
        
        const x = parseInt(s.el.style.left);
        const y = parseInt(s.el.style.top);
        Store.updateScenePosition(s.id, x, y);
        
        s.el.style.zIndex = '';
        
        // If we didn't move much, treat as a CLICK -> Open Edit
        if (!s.moved) {
            QuickEditModal.show(s.id, e.clientX, e.clientY);
        } else {
            this.render(); // Redraw lines
        }
        
        this.state.dragging = null;
    },

    // --- LINKING ---
    startLinking(e) {
        e.stopPropagation();
        e.preventDefault(); // Prevent text selection
        const id = e.target.dataset.id;
        
        // Create Temp Line
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "map-path");
        path.setAttribute("style", "stroke:var(--accent); stroke-dasharray:5,5; pointer-events:none;");
        this.svgLayer.appendChild(path);
        
        const rect = e.target.getBoundingClientRect();
        const cRect = this.mapCanvas.getBoundingClientRect();
        
        this.state.linking = {
            sourceId: id,
            path: path,
            startX: rect.left + rect.width/2 - cRect.left,
            startY: rect.top + rect.height/2 - cRect.top
        };
    },
    updateLink(e) {
        const s = this.state.linking;
        const cRect = this.mapCanvas.getBoundingClientRect();
        const ex = e.clientX - cRect.left;
        const ey = e.clientY - cRect.top;
        s.path.setAttribute("d", `M ${s.startX} ${s.startY} L ${ex} ${ey}`);
    },
    stopLinking(e) {
        const s = this.state.linking;
        if (!s) return;
        s.path.remove();
        
        // Did we drop on a node?
        // Use elementFromPoint because mouse is over the SVG usually
        const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('.map-node');
        
        if (targetEl) {
            const targetId = targetEl.dataset.id;
            if (targetId && targetId !== s.sourceId) {
                // Instantly create the link
                Store.addChoiceWithTarget(s.sourceId, targetId);
            }
        }
        this.state.linking = null;
    },

    // --- PANNING ---
    startPan(e) {
        this.state.panning = true;
        this.mapContainer.style.cursor = 'grabbing';
        this.state.startX = e.clientX;
        this.state.startY = e.clientY;
        this.state.scrollLeft = this.mapContainer.scrollLeft;
        this.state.scrollTop = this.mapContainer.scrollTop;
    },
    updatePan(e) {
        const dx = e.clientX - this.state.startX;
        const dy = e.clientY - this.state.startY;
        this.mapContainer.scrollLeft = this.state.scrollLeft - dx;
        this.mapContainer.scrollTop = this.state.scrollTop - dy;
    },
    stopPan() {
        this.state.panning = false;
        this.mapContainer.style.cursor = 'grab';
    },

    // --- RENDER ---
    render() {
        Dom.clear(this.nodesLayer);
        Dom.clear(this.svgLayer);
        const project = Store.getProject();
        if(!project) return;

        // 1. Calculate Positions (BFS fallback if x/y missing)
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
        Object.entries(levels).forEach(([id, lvl]) => { if(!levelGroups[lvl]) levelGroups[lvl]=[]; levelGroups[lvl].push(id); });

        const positions = {};
        Object.keys(levelGroups).sort((a,b)=>a-b).forEach(lvl => {
            levelGroups[lvl].forEach((id, idx) => {
                const s = project.scenes[id];
                // Use stored X/Y, or calculate default
                let x = s.x;
                let y = s.y;
                
                if (x === undefined || y === undefined) {
                    x = 50 + (lvl * 250);
                    y = 50 + (idx * 100);
                    Store.updateScenePosition(id, x, y);
                }
                positions[id] = { x, y };

                // CREATE NODE
                const el = Dom.create('div', {
                    class: `map-node ${id === project.config.startSceneId ? 'start-node' : ''}`,
                    id: `node-${id}`,
                    dataset: { id },
                    style: { left: x+'px', top: y+'px' },
                    // Right Click Trace
                    onContextMenu: (e) => { e.preventDefault(); this.toggleTrace(id); }
                }, [
                    Dom.create('span', { text: id, style: 'pointer-events:none' })
                ]);

                // CREATE LINK HANDLE (Round thing)
                const handle = Dom.create('div', {
                    class: 'link-handle',
                    dataset: { id },
                    title: 'Drag to connect'
                });
                el.appendChild(handle);

                this.nodesLayer.appendChild(el);
            });
        });

        // 2. Draw Connections
        Object.values(project.scenes).forEach(scene => {
            const p1 = positions[scene.id];
            if (!p1) return;

            scene.choices.forEach((c, idx) => {
                if (!c.target || !positions[c.target]) return;
                const p2 = positions[c.target];

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("class", "map-path");
                
                const startX = p1.x + 140; 
                const startY = p1.y + 25;
                const endX = p2.x; 
                const endY = p2.y + 25;
                const c1x = startX + 50; 
                const c2x = endX - 50;
                
                path.setAttribute("d", `M ${startX} ${startY} C ${c1x} ${startY}, ${c2x} ${endY}, ${endX} ${endY}`);
                this.svgLayer.appendChild(path);

                // LOGIC BADGE (Click to Edit Connection)
                // Place it in the middle of the curve
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                
                const badge = Dom.create('div', {
                    class: 'logic-badge',
                    text: '⚙️', 
                    style: `position:absolute; left:${midX}px; top:${midY}px; width:16px; height:16px; font-size:10px; background:#222; border:1px solid #555; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:50;`,
                    onClick: (e) => {
                        e.stopPropagation();
                        ChoiceModal.show(scene.id, idx);
                    }
                });
                this.nodesLayer.appendChild(badge);
            });
        });
    },

    // Trace Logic (Unchanged from stable)
    toggleTrace(targetId) {
        if(this.tracedNodeId === targetId) { this.clearTrace(); return; }
        this.clearTrace();
        this.tracedNodeId = targetId;
        document.getElementById('map-canvas').classList.add('tracing');
        
        // BFS to find parents
        const parents = {};
        const project = Store.getProject();
        Object.keys(project.scenes).forEach(id => {
            project.scenes[id].choices.forEach(c => {
                if(c.target) {
                    if(!parents[c.target]) parents[c.target] = [];
                    if(!parents[c.target].includes(id)) parents[c.target].push(id);
                }
            });
        });

        const visited = new Set();
        const crawl = (id) => {
            if(visited.has(id)) return;
            visited.add(id);
            document.getElementById(`node-${id}`)?.classList.add('active-path');
            if (id === project.config.startSceneId && id !== targetId) return;
            const p = parents[id] || [];
            p.forEach(pid => crawl(pid));
        };
        crawl(targetId);
    },

    clearTrace() {
        document.getElementById('map-canvas').classList.remove('tracing');
        document.querySelectorAll('.active-path').forEach(el => el.classList.remove('active-path'));
        this.tracedNodeId = null;
    }
};

MapEditor.init();