
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = path.join(ROOT_DIR, 'artifacts');
const frontendDir = path.join(ROOT_DIR, 'src');

function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });
    return arrayOfFiles;
}

function extractContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        return '';
    }
}

function discoverHelp() {
    console.log("Discovering Help & Explanations...");
    const files = getAllFiles(frontendDir).filter(f => f.endsWith('.tsx'));
    const helpItems = [];

    files.forEach(f => {
        const content = extractContent(f);
        // Look for Tooltip, HelpIcon, or title attributes that look like help
        // <Tooltip content="...">
        const tooltipRegex = /<Tooltip[^>]*content=["']([^"']+)["'][^>]*>/g;
        let match;
        while ((match = tooltipRegex.exec(content)) !== null) {
            helpItems.push({
                type: 'tooltip',
                content: match[1],
                file: path.relative(ROOT_DIR, f)
            });
        }

        // <HelpButton ...>
        if (content.includes('<HelpButton')) {
            helpItems.push({
                type: 'help-button',
                file: path.relative(ROOT_DIR, f),
                context: 'Found HelpButton component'
            });
        }
    });

    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'help_inventory.json'), JSON.stringify(helpItems, null, 2));
    console.log(`Discovered ${helpItems.length} Help Items.`);
}

discoverHelp();
