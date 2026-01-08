import fs from 'fs';
import path from 'path';

// Helpers
const walk = (dir: string, filelist: string[] = []) => {
    if (!fs.existsSync(dir)) return filelist;
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            walk(filepath, filelist);
        } else {
            filelist.push(filepath);
        }
    });
    return filelist;
};

const artifactsDir = path.join(process.cwd(), 'artifacts');
if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir);

// 1. App Inventory (Routes & Pages)
const appInventory: any = { routes: [], pages: [] };
const routesFile = path.join(process.cwd(), 'src/routes.tsx');
if (fs.existsSync(routesFile)) {
    const content = fs.readFileSync(routesFile, 'utf-8');
    const matches = content.match(/path:\s*['"]([^'"]+)['"]/g);
    if (matches) {
        appInventory.routes = matches.map(m => m.replace(/path:\s*['"]/, '').replace(/['"]/, ''));
    }
}
const pagesDir = path.join(process.cwd(), 'src/pages');
appInventory.pages = walk(pagesDir).map(p => path.relative(process.cwd(), p));
fs.writeFileSync(path.join(artifactsDir, 'app_inventory.json'), JSON.stringify(appInventory, null, 2));

// 2. API Inventory
const apiInventory: any = { endpoints: [], controllers: [] };
const apiRoutesDir = path.join(process.cwd(), 'api/routes'); // Checking api root first
const apiSrcRoutesDir = path.join(process.cwd(), 'api/src/routes');

const scanApiRoutes = (dir: string) => {
    const files = walk(dir);
    files.forEach(f => {
        const content = fs.readFileSync(f, 'utf-8');
        // Simple regex to find router.get/post/etc.
        const matches = content.match(/router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g);
        if (matches) {
            matches.forEach(m => {
                const parts = m.match(/router\.(\w+)\(['"]([^'"]+)['"]/);
                if (parts) {
                    apiInventory.endpoints.push({ method: parts[1], path: parts[2], file: path.relative(process.cwd(), f) });
                }
            });
        }
    });
};

scanApiRoutes(apiRoutesDir);
scanApiRoutes(apiSrcRoutesDir);
fs.writeFileSync(path.join(artifactsDir, 'api_inventory.json'), JSON.stringify(apiInventory, null, 2));


// 3. UI Element Inventory
const uiInventory: any = { components: [] };
const uiDir = path.join(process.cwd(), 'src/components/ui');
uiInventory.components = walk(uiDir).map(p => path.relative(process.cwd(), p));
fs.writeFileSync(path.join(artifactsDir, 'ui_element_inventory.json'), JSON.stringify(uiInventory, null, 2));

// 4. Data Dictionary (Schema)
const dataDictionary: any = { tables: [] };
const schemaFile = path.join(process.cwd(), 'api/database/schema/schema.sql'); // Guessing path based on lists
// searching for .sql files in api/database or api/db
const potentialSchemaFiles = [
    path.join(process.cwd(), 'api/database/schema.sql'),
    path.join(process.cwd(), 'api/db/schema.sql'),
    path.join(process.cwd(), 'api/src/db/schema.sql'),
    path.join(process.cwd(), 'api/init-core-schema.sql')
];

let schemaContent = '';
for (const p of potentialSchemaFiles) {
    if (fs.existsSync(p)) {
        schemaContent += fs.readFileSync(p, 'utf-8') + '\n';
    }
}

if (schemaContent) {
    const tableMatches = schemaContent.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([^\s(]+)/gi);
    if (tableMatches) {
        dataDictionary.tables = tableMatches.map(m => m.replace(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?/i, ''));
    }
}
fs.writeFileSync(path.join(artifactsDir, 'data_dictionary.json'), JSON.stringify(dataDictionary, null, 2));

console.log('Discovery Phase 1 Complete. Artifacts generated.');
