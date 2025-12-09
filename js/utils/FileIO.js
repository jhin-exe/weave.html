import { Store } from '../data/Store.js';
import { Events } from './Events.js';

export const FileIO = {
    init() {
        // Create the invisible file input for importing
        const input = document.createElement('input');
        input.type = 'file';
        input.id = 'file-import';
        input.accept = '.json';
        input.style.display = 'none';
        input.onchange = (e) => this.handleImport(e);
        document.body.appendChild(input);
    },

    triggerOpen() {
        document.getElementById('file-import').click();
    },

    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // Basic validation/migration logic from your original index.html
                Object.values(data.scenes).forEach(s => { 
                    s.choices.forEach(c => { if(!c.id) c.id = Math.random().toString(36).substr(2, 9); }); 
                    if(!s.image) s.image = ""; 
                    if(!s.audio) s.audio = "";
                });
                
                Store.loadData(data);
                alert("Project loaded successfully.");
            } catch (err) {
                console.error(err);
                alert("Failed to load project: " + err.message);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset so same file can be selected again
    },

    saveProject() {
        const data = Store.getProject();
        if (!data) return;

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (data.meta.title.replace(/\s+/g, '_') || "project") + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

FileIO.init();