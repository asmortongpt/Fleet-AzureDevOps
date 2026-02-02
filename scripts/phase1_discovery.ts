
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = path.join(ROOT_DIR, 'artifacts');

if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR);

const frontendDir = path.join(ROOT_DIR, 'src');
const apiDir = path.join(ROOT_DIR, 'api', 'src');

// --- Helper Functions ---
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

// Global Storage for Feature Analysis
const allEndpoints = [];
const allRoutes = [];

// --- Discovery Modules ---

// 1. API Inventory
function discoverApi() {
    console.log("Discovering API endpoints...");
    const apiFiles = getAllFiles(apiDir).filter(f => f.endsWith('.ts'));

    apiFiles.forEach(f => {
        const content = extractContent(f);
        // Look for router.get, router.post, etc.
        const regex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            allEndpoints.push({
                method: match[1].toUpperCase(),
                path: match[2],
                file: path.relative(ROOT_DIR, f),
                line: content.substring(0, match.index).split('\n').length
            });
        }
    });

    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'api_inventory.json'), JSON.stringify(allEndpoints, null, 2));
    console.log(`Discovered ${allEndpoints.length} API endpoints.`);
}

// 2. App/Route Inventory (Frontend)
function discoverRoutes() {
    console.log("Discovering Frontend Routes...");
    const frontendFiles = getAllFiles(frontendDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

    frontendFiles.forEach(f => {
        const content = extractContent(f);
        // Look for <Route path="..."
        const regex = /<Route[^>]*path=["']([^"']+)["'][^>]*>/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            allRoutes.push({
                path: match[1],
                file: path.relative(ROOT_DIR, f),
                component: (content.match(/element=\{<([^/ >]+)/) || [])[1] // Rough extraction
            });
        }

        // Look for createBrowserRouter paths
        const browserRouterRegex = /path:\s*['"]([^'"]+)['"]/g;
        while ((match = browserRouterRegex.exec(content)) !== null) {
            allRoutes.push({
                path: match[1],
                type: 'router-config',
                file: path.relative(ROOT_DIR, f)
            });
        }
    });

    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'app_inventory.json'), JSON.stringify(allRoutes, null, 2));
    console.log(`Discovered ${allRoutes.length} Frontend Routes.`);
}

// 3. UI Element Inventory
function discoverUiElements() {
    console.log("Discovering UI Elements...");
    const componentsDir = path.join(frontendDir, 'components');
    const componentFiles = getAllFiles(componentsDir).filter(f => f.endsWith('.tsx'));
    const elements = componentFiles.map(f => {
        const name = path.basename(f, '.tsx');
        return {
            name: name,
            path: path.relative(ROOT_DIR, f),
            category: path.dirname(path.relative(componentsDir, f))
        };
    });

    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'ui_element_inventory.json'), JSON.stringify(elements, null, 2));
    console.log(`Discovered ${elements.length} UI Elements.`);
}

// 4. Data Dictionary (Schema)
function discoverDataModel() {
    console.log("Discovering Data Model...");
    const dbDir = path.join(apiDir, 'db');
    const tables = [];

    // Check for schema.ts file directly
    const schemaFile = path.join(dbDir, 'schema.ts');
    if (fs.existsSync(schemaFile)) {
        const content = extractContent(schemaFile);
        const regex = /pgTable\(\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            tables.push({
                tableName: match[1],
                source: path.relative(ROOT_DIR, schemaFile)
            });
        }
    }

    // Also scan schemas directory if it exists
    const schemasDir = path.join(dbDir, 'schemas');
    if (fs.existsSync(schemasDir)) {
        const schemaFiles = getAllFiles(schemasDir).filter(f => f.endsWith('.ts'));
        schemaFiles.forEach(f => {
            const content = extractContent(f);
            const regex = /pgTable\(\s*['"]([^'"]+)['"]/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                tables.push({
                    tableName: match[1],
                    source: path.relative(ROOT_DIR, f)
                });
            }
        });
    }

    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'data_dictionary.json'), JSON.stringify(tables, null, 2));
    console.log(`Discovered ${tables.length} Database Tables.`);
}

// 5. Integrations
function discoverIntegrations() {
    console.log("Discovering Integrations...");
    const allFiles = [...getAllFiles(frontendDir), ...getAllFiles(apiDir)];
    const integrations = new Set();

    const keywords = [
        'twilio', 'sendgrid', 'azure', 'aws', 's3', 'stripe', 'auth0', 'firebase', 'sentry',
        'openai', 'anthropic', 'google maps', 'mapbox', 'leaflet', 'smartcar', 'microsoft graph'
    ];

    allFiles.forEach(f => {
        const content = extractContent(f).toLowerCase();
        keywords.forEach(k => {
            if (content.includes(k)) {
                integrations.add(k);
            }
        });
    });

    const integrationList = Array.from(integrations).map(i => ({ name: i }));
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'integration_inventory.json'), JSON.stringify(integrationList, null, 2));
    console.log(`Discovered ${integrationList.length} Integrations.`);
}

// 6. Feature Registry (Derived)
function generateFeatureRegistry() {
    console.log("Generating Feature Registry...");
    const features = {};

    // Process Routes
    allRoutes.forEach(r => {
        const segment = r.path.split('/')[1]; // /vehicles/list -> vehicles
        if (!segment || segment.startsWith(':') || segment.length < 2) return;

        const key = segment.toLowerCase();
        if (!features[key]) features[key] = { name: key, routes: [], endpoints: [] };
        features[key].routes.push(r.path);
    });

    // Process API Endpoints
    allEndpoints.forEach(e => {
        const segment = e.path.split('/')[1];
        // e.g., /vehicles -> vehicles
        // e.g., /api/vehicles -> api? No, usually router mounts at /api/vehicles, so endpoint is just /. 
        // We need to look at the file path to really know the feature for API.

        let featureName = 'unknown';
        if (e.file.includes('routes/')) {
            const parts = e.file.split('/');
            const routeFile = parts[parts.length - 1];
            featureName = routeFile.replace('.routes.ts', '').replace('.ts', '').replace('router', '');
        }

        if (!features[featureName]) features[featureName] = { name: featureName, routes: [], endpoints: [] };

        features[featureName].endpoints.push(`${e.method} ${e.path} (${e.file})`);
    });

    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'feature_registry.json'), JSON.stringify(features, null, 2));
    console.log(`Identified ${Object.keys(features).length} Features.`);
}

// Main Execution
async function main() {
    console.log("Starting Phase 1: Exhaustive Discovery...");

    try {
        discoverApi();
        discoverRoutes();
        discoverUiElements();
        discoverDataModel();
        discoverIntegrations();
        generateFeatureRegistry();

        console.log("Discovery Complete. Artifacts generated in /artifacts/");
    } catch (error) {
        console.error("Discovery failed:", error);
    }
}

main();
