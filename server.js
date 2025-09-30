const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 1234;

const srcDir = path.join(__dirname, 'src');
const ignoreFolders = ['node_modules', '.git', '.vscode'];

// Build all slides
fs.readdirSync(srcDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !ignoreFolders.includes(dirent.name))
    .forEach(project => {
        const projectPath = path.join(srcDir, project.name);
        const slideMd = path.join(projectPath, 'sources', 'slide.md');

        if (!fs.existsSync(slideMd)) {
            console.warn(`❌ No slide.md found for ${project.name}, skipping...`);
            return;
        }

        const outFile = path.join(projectPath, `${project.name}.html`);
        const cmd = `npx @marp-team/marp-cli "${slideMd}" -o "${outFile}" --allow-local-files`;

        try {
            console.log(`🔨 Building ${project.name} -> ${outFile}`);
            execSync(cmd, { stdio: 'inherit' });
            console.log(`✅ Done: ${project.name}`);
        } catch (err) {
            console.error(`❌ Error building ${project.name}:`, err.message);
        }
    });

// Serve images statically
// Serve entire project folder statically
app.use('/projects/:projectName', (req, res, next) => {
    const projectPath = path.join(srcDir, req.params.projectName);
    express.static(projectPath)(req, res, next);
});
app.use('/:projectName/images', (req, res, next) => {
    const imagesPath = path.join(srcDir, req.params.projectName, 'images');
    express.static(imagesPath)(req, res, next);
});
app.get('/:projectName', (req, res) => {
    const htmlFile = path.join(srcDir, req.params.projectName, `${req.params.projectName}.html`);
    res.sendFile(htmlFile);
});
// 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
