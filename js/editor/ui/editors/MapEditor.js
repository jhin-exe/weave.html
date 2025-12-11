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

        // Interaction State
        this.state = {
            draggingNode: null,
            drawingLink: null,
            panning: false,
            startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0,
            tempLine: null
        };

        this.attachListeners();

        Events.on('tab:changed', (id) => { if(id === 'map') this.render(); });
        Events.on('project:updated', () => { if(TabManager.activeTab === 'map') this.render(); });
    },

    attachListeners() {
        const cont = this.mapContainer;

        // 1. Mouse Down (Router)
        cont.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('link-handle')) {
                this.startLinking(e);
            } else if (e.target.closest('.map-node')) {
                // If checking specifically for dragging handle, or just whole node?
                // Let's say drag whole node unless it was the link handle
                this.startDragging(e);
            } else {
                this.startPanning(e);
            }
        });

        // 2. Mouse Move (Router)
        document.addEventListener('mousemove', (e) => {
            if (this.state.draggingNode) this.updateDrag(e);
            else if (this.state.drawingLink) this.updateLink(e);
            else if (this.state.panning) this.updatePan(e);
        });

        // 3. Mouse Up (Router)
        document.addEventListener('mouseup', (e) => {
            if (this.state.draggingNode) this.stopDrag();
            if (this.state.drawingLink) this.stopLinking(e);
            if (this.state.panning) this.stopPanning();
        });
    },

    // --- PANNING ---
    startPanning(e) {
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
        if(e.button !== 0) return;
        const nodeEl = e.target.closest('.map-node');
        const id = nodeEl.dataset.id;
        
        this.state.draggingNode = {
            id: id,
            el: nodeEl,
            offsetX: e.clientX - nodeEl.offsetLeft,
            offsetY: e.clientY - nodeEl.offsetTop
        };
        nodeEl.style.zIndex = 100;
        QuickEditModal.hide(); // Hide popup if dragging
    },
    updateDrag(e) {
        const s = this.state.draggingNode;
        // Calculate new position relative to canvas
        // Note: mapCanvas is static size, we just move absolute div
        // We need to account for container scroll if the mouse leaves? 
        // Simpler: Just map mouse client to offset
        
        // Correct logic: Mouse Position in Canvas Space
        const rect = this.mapCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left - (s.offsetX - (e.clientX - e.target.getBoundingClientRect().left)); // Approximated
        
        // Simple relative move:
        const containerRect = this.mapContainer.getBoundingClientRect();
        const scrollLeft = this.mapContainer.scrollLeft;
        const scrollTop = this.mapContainer.scrollTop;
        
        const newX = (e.clientX - containerRect.left + scrollLeft) - (s.offsetX - (s.el.getBoundingClientRect().left - containerRect.left)); // Getting messy.
        
        // Easier: Just update style.left/top based on movement
        // Let's use the standard "position absolute" drag logic
        const mapX = e.pageX - this.mapCanvas.offsetParent.offsetLeft + this.mapContainer.scrollLeft; 
        // Wait, offsetParent might be body. 
        
        // Let's try simpler: 
        const xPos = e.clientX + this.mapContainer.scrollLeft - this.mapContainer.getBoundingClientRect().left - 20; // 20 is arbitrary handle offset
        const yPos = e.clientY + this.mapContainer.scrollTop - this.mapContainer.getBoundingClientRect().top - 10;

        s.el.style.left = xPos + 'px';
        s.el.style.top = yPos + 'px';
        
        // Trigger redraw of lines? Ideally yes, but expensive.
        // For MVP, we redraw on drop.
    },
    stopDrag() {
        if (!this.state.draggingNode) return;
        const id = this.state.draggingNode.id;
        const el = this.state.draggingNode.el;
        
        // Update Store
        Store.updateScenePosition(id, parseInt(el.style.left), parseInt(el.style.top));
        
        el.style.zIndex = '';
        this.state.draggingNode = null;
        this.render(); // Redraw lines
    },

    // --- VISUAL LINKING ---
    startLinking(e) {
        e.stopPropagation();
        e.preventDefault();
        const id = e.target.dataset.id;
        
        // Create Temp Line
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "map-path");
        path.setAttribute("style", "stroke:var(--accent); stroke-dasharray:5,5;");
        this.svgLayer.appendChild(path);
        
        const rect = e.target.getBoundingClientRect();
        const containerRect = this.mapCanvas.getBoundingClientRect();
        
        this.state.drawingLink = {
            sourceId: id,
            path: path,
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
        
        // Check if dropped on a node
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

        // 1. Calculate Positions (Use stored X/Y or Auto-layout if missing)
        // If X/Y is 0/undefined, we might want to run BFS once to set defaults?
        // For now, let's assume they have defaults from Store.addScene or previous render.
        
        // Render Nodes
        Object.values(project.scenes).forEach(scene => {
            const x = scene.x || 50;
            const y = scene.y || 50;
            
            const el = Dom.create('div', {
                class: `map-node ${scene.id === project.config.startSceneId ? 'start-node' : ''}`,
                id: `node-${scene.id}`,
                dataset: { id: scene.id },
                style: { left: x + 'px', top: y + 'px' },
                // Left click opens Quick Edit, Right click traces
                onClick: (e) => { 
                    e.stopPropagation();
                    const rect = el.getBoundingClientRect();
                    QuickEditModal.show(scene.id, rect.right + 10, rect.top);
                },
                onContextMenu: (e) => { e.preventDefault(); /* Trace logic */ }
            }, [
                Dom.create('div', { text: scene.id, style: 'pointer-events:none;' })
            ]);

            // Visual Link Handle (Right side)
            const handle = Dom.create('div', {
                class: 'link-handle',
                dataset: { id: scene.id },
                title: 'Drag to link'
            });
            el.appendChild(handle);

            this.nodesLayer.appendChild(el);
        });

        // Render Links
        Object.values(project.scenes).forEach(scene => {
            scene.choices.forEach(c => {
                if(!c.target || !project.scenes[c.target]) return;
                
                const p1 = project.scenes[scene.id];
                const p2 = project.scenes[c.target];
                
                // Coordinates
                const startX = (p1.x || 50) + 140; // Width of node roughly
                const startY = (p1.y || 50) + 25;  // Half height
                const endX = (p2.x || 50);
                const endY = (p2.y || 50) + 25;

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("class", "map-path");
                
                const c1x = startX + 50; 
                const c2x = endX - 50;
                path.setAttribute("d", `M ${startX} ${startY} C ${c1x} ${startY}, ${c2x} ${endY}, ${endX} ${endY}`);
                
                this.svgLayer.appendChild(path);
            });
        });
    }
};

MapEditor.init();