import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';
import { TabManager } from '../TabManager.js';
import { QuickEditModal } from '../modals/QuickEditModal.js';

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

        // Sidebar Tools (Keep simple scene creator)
        const tools = Dom.create('div', { 
            style: 'position:absolute; top:10px; left:10px; display:flex; flex-direction:column; gap:5px; z-index:20;' 
        }, [
            Dom.create('button', { class: 'btn btn-sm btn-primary', text: '+ Scene', onClick: () => Store.addScene() })
        ]);
        container.appendChild(tools);

        this.tracedNodeId = null;
        this.state = {
            draggingNode: null,
            drawingLink: null,
            panning: false,
            startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0,
            tempLine: null
        };

        this.initInteraction();

        Events.on('tab:changed', (id) => { if(id === 'map') this.render(); });
        Events.on('project:updated', () => { if(TabManager.activeTab === 'map') this.render(); });
    },

    initInteraction() {
        const cont = this.mapContainer;

        // MOUSE DOWN ROUTER
        cont.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('link-handle')) {
                this.startLinking(e);
            } else if (e.target.closest('.map-node')) {
                // If right click, ignore drag, let context menu fire
                if (e.button === 2) return; 
                this.startDragging(e);
            } else {
                this.startPanning(e);
            }
        });

        // MOUSE MOVE ROUTER
        document.addEventListener('mousemove', (e) => {
            if (this.state.draggingNode) this.updateDrag(e);
            else if (this.state.drawingLink) this.updateLink(e);
            else if (this.state.panning) this.updatePan(e);
        });

        // MOUSE UP ROUTER
        document.addEventListener('mouseup', (e) => {
            if (this.state.draggingNode) this.stopDrag();
            if (this.state.drawingLink) this.stopLinking(e);
            if (this.state.panning) this.stopPanning();
        });
    },

    // --- PANNING ---
    startPanning(e) {
        if(e.button !== 0) return; // Only left click pan
        this.state.panning = true;
        this.mapContainer.style.cursor = 'grabbing';
        this.state.startX = e.pageX - this.mapContainer.offsetLeft;
        this.state.startY = e.pageY - this.mapContainer.offsetTop;
        this.state.scrollLeft = this.mapContainer.scrollLeft;
        this.state.scrollTop = this.mapContainer.scrollTop;
    },
    updatePan(e) {
        e.preventDefault();
        const x = e.pageX - this.mapContainer.offsetLeft;
        const y = e.pageY - this.mapContainer.offsetTop;
        const walkX = (x - this.state.startX);
        const walkY = (y - this.state.startY);
        this.mapContainer.scrollLeft = this.state.scrollLeft - walkX;
        this.mapContainer.scrollTop = this.state.scrollTop - walkY;
    },
    stopPanning() {
        this.state.panning = false;
        this.mapContainer.style.cursor = 'grab';
    },

    // --- DRAGGING NODE ---
    startDragging(e) {
        const nodeEl = e.target.closest('.map-node');
        const id = nodeEl.dataset.id;
        
        this.state.draggingNode = {
            id: id,
            el: nodeEl,
            // Offset from top-left of node
            offsetX: e.clientX - nodeEl.getBoundingClientRect().left,
            offsetY: e.clientY - nodeEl.getBoundingClientRect().top
        };
        nodeEl.style.zIndex = 100;
        QuickEditModal.hide(); 
    },
    updateDrag(e) {
        const s = this.state.draggingNode;
        const containerRect = this.mapContainer.getBoundingClientRect();
        
        // Calculate position relative to container content
        const x = e.clientX - containerRect.left + this.mapContainer.scrollLeft - s.offsetX;
        const y = e.clientY - containerRect.top + this.mapContainer.scrollTop - s.offsetY;

        s.el.style.left = x + 'px';
        s.el.style.top = y + 'px';
        
        // We update store silently so links draw correctly on re-render (optional)
        // Or we can just move the element and update store on drop.
        // For smoother links, we should probably update store + re-render links, but that's heavy.
        // Let's just move the element for now.
    },
    stopDrag() {
        if (!this.state.draggingNode) return;
        const id = this.state.draggingNode.id;
        const el = this.state.draggingNode.el;
        
        const x = parseInt(el.style.left);
        const y = parseInt(el.style.top);

        Store.updateScenePosition(id, x, y);
        
        el.style.zIndex = '';
        this.state.draggingNode = null;
        
        // Save and Redraw links
        Store.save();
        this.render(); 
    },

    // --- VISUAL LINKING ---
    startLinking(e) {
        e.stopPropagation();
        e.preventDefault();
        const id = e.target.dataset.id;
        
        // Create Temp SVG Line
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "map-path");
        path.setAttribute("style", "stroke:var(--accent); stroke-dasharray:5,5; pointer-events:none;");
        this.svgLayer.appendChild(path);
        
        const rect = e.target.getBoundingClientRect();
        const containerRect = this.mapCanvas.getBoundingClientRect(); // Canvas is the relative parent
        
        this.state.drawingLink = {
            sourceId: id,
            path: path,
            // Start relative to canvas
            startX: rect.left + rect.width/2 - containerRect.left,
            startY: rect.top + rect.height/2 - containerRect.top
        };
    },
    updateLink(e) {
        const s = this.state.drawingLink;
        const containerRect = this.mapCanvas.getBoundingClientRect();
        
        const endX = e.clientX - containerRect.left;
        const endY = e.clientY - containerRect.top;
        
        s.path.setAttribute("d", `M ${s.startX} ${s.startY} L ${endX} ${endY}`);
    },
    stopLinking(e) {
        const s = this.state.drawingLink;
        if (!s) return;
        
        s.path.remove();
        this.state.drawingLink = null;
        
        const targetEl = e.target.closest('.map-node');
        if (targetEl) {
            const targetId = targetEl.dataset.id;
            if (targetId && targetId !== s.sourceId) {
                Store.addChoiceWithTarget(s.sourceId, targetId);
            }
        }
    },

    // --- RENDER ---
    render() {
        Dom.clear(this.nodesLayer);
        Dom.clear(this.svgLayer);
        const project = Store.getProject();
        if(!project) return;

        // BFS Layout for defaults, but prefer stored X/Y
        // We run BFS to calculate levels, but only use them if X/Y are missing (0/0)
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

        // Calculate positions
        const positions = {};
        Object.keys(levelGroups).sort((a,b)=>a-b).forEach(lvl => {
            levelGroups[lvl].forEach((id, idx) => {
                const s = project.scenes[id];
                // Use stored if > 0 (assuming 0,0 is default/invalid) or specifically set
                // Just checking if x exists in your object structure. 
                // Store init sets x=100, y=100.
                // If it's effectively default/clashing, apply layout.
                // Simple heuristic: If we haven't dragged it, use auto layout.
                
                // For now, let's respect X/Y if they are not 100/100 (default) OR if we want to enforce layout on load.
                // Better approach: If X/Y exist, use them. If not, calculate. 
                // Since I added X/Y to Store, they exist. 
                // Let's use them directly.
                
                let x = s.x;
                let y = s.y;
                
                // If this is a fresh load of an old project, X/Y might be undefined.
                if (x === undefined || y === undefined) {
                    x = 50 + (lvl * 220);
                    y = 50 + (idx * 80);
                    // Update store so it sticks next time
                    Store.updateScenePosition(id, x, y);
                }

                positions[id] = { x, y };

                const el = Dom.create('div', {
                    class: `map-node ${id === project.config.startSceneId ? 'start-node' : ''}`,
                    id: `node-${id}`,
                    text: id,
                    dataset: { id: id },
                    style: { left: x + 'px', top: y + 'px' },
                    
                    // Interaction Handlers
                    // Left Click -> Quick Edit (via bubble event, check stopPropagation in Drag)
                    onClick: (e) => { 
                        e.stopPropagation();
                        // Only show if not dragging
                        if (!this.state.draggingNode) {
                            const rect = el.getBoundingClientRect();
                            // Pass page coordinates to modal
                            QuickEditModal.show(id, e.pageX + 20, e.pageY);
                        }
                    },
                    
                    // Right Click -> Trace
                    onContextMenu: (e) => { 
                        e.preventDefault(); 
                        this.toggleTrace(id); 
                    }
                });

                // Link Handle
                const handle = Dom.create('div', {
                    class: 'link-handle',
                    dataset: { id: id },
                    title: 'Drag to link'
                });
                el.appendChild(handle);

                this.nodesLayer.appendChild(el);
            });
        });

        // Draw Links
        Object.keys(project.scenes).forEach(id => {
            const p1 = positions[id];
            if(!p1) return;
            project.scenes[id].choices.forEach((c, i) => {
                const p2 = positions[c.target];
                if(p2) {
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("class", "map-path");
                    path.setAttribute("id", `link-${id}-${c.target}-${i}`); // ID for trace
                    
                    // Source: Right side of node
                    const startX = p1.x + 140; 
                    const startY = p1.y + 25; // Middle of node roughly
                    
                    // Target: Left side of node
                    const endX = p2.x; 
                    const endY = p2.y + 25;

                    const c1x = startX + 50; 
                    const c2x = endX - 50;
                    path.setAttribute("d", `M ${startX} ${startY} C ${c1x} ${startY}, ${c2x} ${endY}, ${endX} ${endY}`);
                    this.svgLayer.appendChild(path);
                }
            });
        });
    },

    // --- TRACING (Restored) ---
    toggleTrace(targetId) {
        if(this.tracedNodeId === targetId) { this.clearTrace(); return; }
        this.clearTrace();
        this.tracedNodeId = targetId;
        document.getElementById('map-canvas').classList.add('tracing');

        const visited = new Set();
        const activeNodes = new Set();
        const activeLinks = new Set();
        const project = Store.getProject();
        
        // Rebuild parent map freshly
        const parents = {};
        Object.keys(project.scenes).forEach(id => {
            project.scenes[id].choices.forEach(c => {
                if(c.target) {
                    if(!parents[c.target]) parents[c.target] = [];
                    if(!parents[c.target].includes(id)) parents[c.target].push(id);
                }
            });
        });

        const crawl = (id) => {
            if(visited.has(id)) return;
            visited.add(id);
            activeNodes.add(id);
            if (id === project.config.startSceneId && id !== targetId) return;
            const p = parents[id] || [];
            p.forEach(pid => {
                // Find specific choice index for link ID
                project.scenes[pid].choices.forEach((c, idx) => {
                    if(c.target === id) activeLinks.add(`link-${pid}-${id}-${idx}`);
                });
                crawl(pid);
            });
        };
        crawl(targetId);
        
        activeNodes.forEach(id => { const el = document.getElementById(`node-${id}`); if(el) el.classList.add('active-path'); });
        activeLinks.forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('active-path'); });
    },

    clearTrace() {
        document.getElementById('map-canvas').classList.remove('tracing');
        document.querySelectorAll('.active-path').forEach(el => el.classList.remove('active-path'));
        this.tracedNodeId = null;
    }
};
MapEditor.init();