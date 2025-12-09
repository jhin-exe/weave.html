import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';
import { TabManager } from '../TabManager.js';

export const LogicEditor = {
    init() {
        const container = TabManager.getContainer('logic');
        this.mainPane = Dom.create('div', { class: 'main-pane' });
        
        // This GRID-2 class needs to exist in CSS for this to align side-by-side
        this.grid = Dom.create('div', { class: 'grid-2', style: 'max-width:900px; margin:0 auto; width:100%;' });
        
        this.mainPane.appendChild(this.grid);
        container.appendChild(this.mainPane);

        Events.on('project:updated', () => this.render());
        Events.on('tab:changed', (id) => { if(id === 'logic') this.render(); });
    },

    filterList(val, containerId) {
        const items = document.querySelectorAll(`#${containerId} .list-item`);
        items.forEach(item => { 
            item.style.display = item.innerText.toLowerCase().includes(val.toLowerCase()) ? 'flex' : 'none'; 
        });
    },

    render() {
        Dom.clear(this.grid);
        const project = Store.getProject();
        if (!project) return;

        // --- Column 1: Variables ---
        const varCol = Dom.create('div', {});
        const varHeader = Dom.create('div', { class: 'flex', style: 'justify-content:space-between; align-items:center; margin-bottom:10px;' }, [
            Dom.create('h3', { text: 'Variables', style: 'margin:0; font-size:14px;' }),
            Dom.create('button', { 
                class: 'btn btn-primary btn-sm', 
                text: '+ Add',
                onClick: () => {
                    const name = prompt("Variable Name:");
                    if(name) { project.variables[name] = 0; Store.save(); this.render(); }
                }
            })
        ]);
        const varSearch = Dom.create('input', { 
            placeholder: 'Search variables...', 
            style: 'margin-bottom:10px;',
            onInput: (e) => this.filterList(e.target.value, 'var-list')
        });
        const varList = Dom.create('div', { id: 'var-list' });
        Object.keys(project.variables).forEach(key => {
            varList.appendChild(Dom.create('div', { class: 'list-item' }, [
                Dom.create('span', { text: key }),
                Dom.create('button', { 
                    class: 'btn btn-danger btn-sm', 
                    text: '×',
                    onClick: () => { delete project.variables[key]; Store.save(); this.render(); }
                })
            ]));
        });
        varCol.appendChild(varHeader);
        varCol.appendChild(varSearch);
        varCol.appendChild(varList);

        // --- Column 2: Items ---
        const itemCol = Dom.create('div', {});
        const itemHeader = Dom.create('div', { class: 'flex', style: 'justify-content:space-between; align-items:center; margin-bottom:10px;' }, [
            Dom.create('h3', { text: 'Inventory', style: 'margin:0; font-size:14px;' }),
            Dom.create('button', { 
                class: 'btn btn-primary btn-sm', 
                text: '+ Add',
                onClick: () => {
                    const id = prompt("Item ID:");
                    if(id) { project.items.push(id); Store.save(); this.render(); }
                }
            })
        ]);
        const itemSearch = Dom.create('input', { 
            placeholder: 'Search items...', 
            style: 'margin-bottom:10px;',
            onInput: (e) => this.filterList(e.target.value, 'item-list')
        });
        const itemList = Dom.create('div', { id: 'item-list' });
        project.items.forEach((item, idx) => {
            itemList.appendChild(Dom.create('div', { class: 'list-item' }, [
                Dom.create('span', { text: item }),
                Dom.create('button', { 
                    class: 'btn btn-danger btn-sm', 
                    text: '×',
                    onClick: () => { project.items.splice(idx, 1); Store.save(); this.render(); }
                })
            ]));
        });
        itemCol.appendChild(itemHeader);
        itemCol.appendChild(itemSearch);
        itemCol.appendChild(itemList);

        this.grid.appendChild(varCol);
        this.grid.appendChild(itemCol);
    }
};
LogicEditor.init();