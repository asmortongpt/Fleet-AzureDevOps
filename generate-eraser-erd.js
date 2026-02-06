import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the ERD code
const erdCode = fs.readFileSync(
  path.join(__dirname, 'docs/architecture/cta-fleet-erd-eraser-code.txt'),
  'utf-8'
);

// Read API key from environment
const ERASER_API_KEY = 'Jk5pFFk3FD8RDcoLVr7A';

// Prepare the API request
const requestBody = {
  theme: 'light',
  background: true,
  elements: [
    {
      type: 'diagram',
      diagramType: 'entity-relationship-diagram',
      code: erdCode,
      id: 'cta-fleet-erd'
    }
  ],
  scale: 2,
  imageQuality: 3
};

console.log('🚀 Generating CTA Fleet ERD using Eraser.io API...\n');
console.log('📊 Diagram includes:');
console.log('   - 40+ core entities');
console.log('   - 70+ relationships');
console.log('   - Multi-tenant architecture');
console.log('   - Color-coded by domain\n');

// Make the API call
fetch('https://app.eraser.io/api/render/elements', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ERASER_API_KEY}`
  },
  body: JSON.stringify(requestBody)
})
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => {
        throw new Error(`HTTP ${response.status}: ${text}`);
      });
    }
    return response.json();
  })
  .then(data => {
    console.log('✅ ERD generated successfully!\n');
    console.log('📷 Image URL:', data.imageUrl);

    if (data.createEraserFileUrl) {
      console.log('🔗 Editable Eraser File:', data.createEraserFileUrl);
    }

    // Save the response
    const outputPath = path.join(__dirname, 'docs/architecture/eraser-erd-response.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log('\n💾 Response saved to:', outputPath);

    // Download the image
    if (data.imageUrl) {
      console.log('\n⬇️  Downloading image...');
      return fetch(data.imageUrl)
        .then(res => res.buffer())
        .then(buffer => {
          const imagePath = path.join(__dirname, 'docs/architecture/CTA-FLEET-ERD-Visual.png');
          fs.writeFileSync(imagePath, buffer);
          console.log('✅ Image saved to:', imagePath);
          return data;
        });
    }
    return data;
  })
  .then(() => {
    console.log('\n🎉 Complete! Visual ERD diagram has been generated.');
    console.log('\n📂 Files created:');
    console.log('   1. docs/architecture/CTA-FLEET-ERD-Visual.png (diagram image)');
    console.log('   2. docs/architecture/eraser-erd-response.json (API response)');
    console.log('   3. docs/architecture/cta-fleet-erd-eraser-code.txt (ERD source code)');
  })
  .catch(error => {
    console.error('❌ Error generating ERD:', error.message);
    console.error('\n📝 Error details:', error);
    process.exit(1);
  });
