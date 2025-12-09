import { Dom } from '../../../utils/Dom.js';
import { Store } from '../../../data/Store.js';
import { Events } from '../../../utils/Events.js';
import { TabManager } from '../TabManager.js';

export const LogicEditor = {
    init() {
        const container = TabManager.getContainer('logic');
        
        this.mainPane = Dom.create('div', { class: 'main-pane' });
        this.grid = Dom.create('div', { class: 'grid-2', style: { maxWidth: '900px', margin: '0 auto' } });
        
        this.mainPane.appendChild(this.grid);
        container.appendChild(this.mainPane);

        Events.on('project:updated', () => this.render());
        Events.on('tab:changed', (id) => { if(id === 'logic') this.render(); });
    },

    render() {
        Dom.clear(this.grid);
        const project = Store.getProject();
        if (!project) return;

        // Column 1: Variables
        const varCol = Dom.create('div', {}, [
            Dom.create('div', { class: 'flex', style: 'justify-content:space-between; align-items:center; margin-bottom:10px;' }, [
                Dom.create('h3', { text: 'Variables', style: 'margin:0; font-size:14px;' }),
                Dom.create('button', { 
                    class: 'btn btn-primary btn-sm', 
                    text: '+ Add',
                    onClick: () => {
                        const name = prompt("Variable Name:");
                        if(name) { project.variables[name] = 0; Store.save(); this.render(); }
                    }
                })
            ]),
            Dom.create('div', { id: 'var-list' })
        ]);

        Object.keys(project.variables).forEach(key => {
            varCol.lastChild.appendChild(Dom.create('div', { class: 'list-item' }, [
                Dom.create('span', { text: key }),
                Dom.create('button', { 
                    class: 'btn btn-danger btn-sm', 
                    text: '×',
                    onClick: () => { delete project.variables[key]; Store.save(); this.render(); }
                })
            ]));
        });

        // Column 2: Items
        const itemCol = Dom.create('div', {}, [
            Dom.create('div', { class: 'flex', style: 'justify-content:space-between; align-items:center; margin-bottom:10px;' }, [
                Dom.create('h3', { text: 'Inventory', style: 'margin:0; font-size:14px;' }),
                Dom.create('button', { 
                    class: 'btn btn-primary btn-sm', 
                    text: '+ Add',
                    onClick: () => {
                        const id = prompt("Item ID:");
                        if(id) { project.items.push(id); Store.save(); this.render(); }
                    }
                })
            ]),
            Dom.create('div', { id: 'item-list' })
        ]);

        project.items.forEach((item, idx) => {
            itemCol.lastChild.appendChild(Dom.create('div', { class: 'list-item' }, [
                Dom.create('span', { text: item }),
                Dom.create('button', { 
                    class: 'btn btn-danger btn-sm', 
                    text: '×',
                    onClick: () => { project.items.splice(idx, 1); Store.save(); this.render(); }
                })
            ]));
        });

        this.grid.appendChild(varCol);
        this.grid.appendChild(itemCol);
    }
};
LogicEditor.init();