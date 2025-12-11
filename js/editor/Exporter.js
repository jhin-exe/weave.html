import { Store } from '../data/Store.js';

export const Exporter = {
    init() {
        const btn = document.getElementById('btn-export-game');
        if (btn) btn.onclick = () => this.export();
    },

    async export() {
        const project = Store.getProject();
        if (!project) return alert("No project to export.");

        const btn = document.getElementById('btn-export-game');
        const originalText = btn.textContent;
        btn.textContent = "Bundling...";

        try {
            // 1. Fetch Source Files
            const [parserSrc, audioSrc, runtimeSrc, cssSrc] = await Promise.all([
                this.fetchFile('./js/core/Parser.js'),
                this.fetchFile('./js/core/AudioController.js'),
                this.fetchFile('./js/core/Runtime.js'),
                this.fetchFile('./css/themes.css')
            ]);

            // 2. Process Scripts
            const cleanParser = this.stripModule(parserSrc, 'const Parser');
            const cleanAudio = this.stripModule(audioSrc, 'class AudioController');
            
            // Remove imports from Runtime
            let cleanRuntime = this.stripModule(runtimeSrc, 'class Runtime');
            cleanRuntime = cleanRuntime.replace(/import .* from .*/g, '');

            // 3. Build HTML Template
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.meta.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=${project.theme.font.replace(/\s+/g, '+')}:wght@400;700&display=swap" rel="stylesheet">
    <style>
        ${cssSrc}
        /* User Custom CSS */
        ${project.theme.customCss}
        
        :root {
            --rt-bg: ${project.theme.bg};
            --rt-text: ${project.theme.text};
            --rt-accent: ${project.theme.accent};
            --rt-border: ${project.theme.border};
            --rt-font: '${project.theme.font}', sans-serif;
        }
        body { margin: 0; background: var(--rt-bg); color: var(--rt-text); height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
    </style>
</head>
<body>
    <div id="game-root" class="rt-root layout-${project.theme.layout}"></div>

    <script>
        // --- WEAVE ENGINE BUNDLE ---
        
        ${cleanParser}
        
        ${cleanAudio}
        
        ${cleanRuntime}

        // --- GAME DATA ---
        const projectData = ${JSON.stringify(project)};

        // --- BOOTSTRAP ---
        window.onload = function() {
            const root = document.getElementById('game-root');
            const runtime = new Runtime(root);
            runtime.init(projectData);
            
            // EXPOSE GLOBALLY FOR BUTTONS
            window.activeRuntime = runtime;
        };
    </script>
</body>
</html>`;

            // 4. Trigger Download
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = (project.meta.title.replace(/\s+/g, '_') || 'game') + '.html';
            a.click();
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error(err);
            alert("Export failed. See console for details.");
        } finally {
            btn.textContent = originalText;
        }
    },

    async fetchFile(path) {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Failed to load ${path}`);
        return await res.text();
    },

    stripModule(source, declarationStart) {
        return source.replace(new RegExp(`export ${declarationStart}`), declarationStart);
    }
};

setTimeout(() => Exporter.init(), 100);