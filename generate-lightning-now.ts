/**
 * Generate 2025 Ford F-150 Lightning - Production Script
 * This will use real API credits and generate actual 3D models
 */

import * as fs from 'fs';
import * as path from 'path';

import FordLightningGenerator from './meshy-ford-lightning-generator';

// Your Meshy API key - MUST be set in environment variables
const MESHY_API_KEY = process.env.MESHY_API_KEY;
if (!MESHY_API_KEY) {
  throw new Error(
    'MESHY_API_KEY environment variable is required. ' +
    'Please set it in your .env file. ' +
    'Get your API key from: https://meshy.ai/dashboard/api-keys'
  );
}

async function main() {
  console.log('🚗 2025 Ford F-150 Lightning 3D Model Generation');
  console.log('================================================\n');

  const generator = new FordLightningGenerator(MESHY_API_KEY);

  // Configuration for the Lightning
  const config = {
    paintColor: 'Antimatter Blue' as const,
    trim: 'Lariat' as const,
    wheels: '20-inch' as const,
    features: {
      bedLiner: true,
      tonneau_cover: true,
      running_boards: true,
      bed_lights: true,
    },
  };

  console.log('📋 Configuration:');
  console.log(`   Paint Color: ${config.paintColor}`);
  console.log(`   Trim Level: ${config.trim}`);
  console.log(`   Wheels: ${config.wheels}`);
  console.log(`   Features: ${Object.keys(config.features).filter(k => config.features[k]).join(', ')}`);
  console.log('');

  console.log('💰 Cost: 30 credits (20 for mesh + 10 for textures)');
  console.log('⏱️  Estimated Time: 5-10 minutes');
  console.log('📦 Output Formats: GLB, FBX, OBJ, USDZ + PBR Textures');
  console.log('');

  const startTime = Date.now();

  try {
    console.log('🚀 Starting generation...\n');

    // Generate the model
    const result = await generator.generateFromText(config);

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n✅ Generation Complete!');
    console.log(`⏱️  Total Time: ${duration} seconds (${Math.round(duration / 60)} minutes)`);
    console.log('');

    console.log('📊 Model Information:');
    console.log(`   Task ID: ${result.id}`);
    console.log(`   Status: ${result.status}`);
    console.log('');

    if (result.model_urls) {
      console.log('🔗 Model URLs:');
      if (result.model_urls.glb) console.log(`   GLB: ${result.model_urls.glb}`);
      if (result.model_urls.fbx) console.log(`   FBX: ${result.model_urls.fbx}`);
      if (result.model_urls.obj) console.log(`   OBJ: ${result.model_urls.obj}`);
      if (result.model_urls.usdz) console.log(`   USDZ: ${result.model_urls.usdz}`);
      console.log('');
    }

    if (result.texture_urls) {
      console.log('🎨 Texture URLs:');
      if (result.texture_urls.base_color) console.log(`   Base Color: ${result.texture_urls.base_color}`);
      if (result.texture_urls.metallic) console.log(`   Metallic: ${result.texture_urls.metallic}`);
      if (result.texture_urls.roughness) console.log(`   Roughness: ${result.texture_urls.roughness}`);
      if (result.texture_urls.normal) console.log(`   Normal: ${result.texture_urls.normal}`);
      console.log('');
    }

    if (result.thumbnail_url) {
      console.log(`🖼️  Thumbnail: ${result.thumbnail_url}`);
      console.log('');
    }

    // Download the model files
    const outputDir = './output/lightning_generation';
    console.log(`💾 Downloading model files to ${outputDir}...`);

    await generator.downloadModel(result, outputDir);

    console.log('');
    console.log('✅ All files downloaded successfully!');
    console.log('');

    // Save metadata
    const metadata = {
      taskId: result.id,
      configuration: config,
      generatedAt: new Date().toISOString(),
      duration: duration,
      modelUrls: result.model_urls,
      textureUrls: result.texture_urls,
      thumbnailUrl: result.thumbnail_url,
    };

    fs.writeFileSync(
      path.join(outputDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('📁 Files created:');
    const files = fs.readdirSync(outputDir);
    files.forEach(file => {
      const stats = fs.statSync(path.join(outputDir, file));
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   ✓ ${file} (${sizeMB} MB)`);
    });

    console.log('');
    console.log('🎉 Success! Your 2025 Ford F-150 Lightning 3D model is ready!');
    console.log('');
    console.log('📖 Next Steps:');
    console.log('   1. View the GLB file in a 3D viewer (https://gltf-viewer.donmccurdy.com/)');
    console.log('   2. Import into Blender, Unity, Unreal, etc.');
    console.log('   3. Use in your fleet management app');
    console.log('   4. Generate more color variants (10 credits each)');
    console.log('');

  } catch (error) {
    console.error('\n❌ Generation Failed!');
    console.error('Error:', error instanceof Error ? error.message : error);
    console.error('');
    console.error('🔍 Troubleshooting:');
    console.error('   1. Check your API key is valid');
    console.error('   2. Verify you have sufficient credits');
    console.error('   3. Check your internet connection');
    console.error('   4. Review Meshy.ai API status');
    console.error('');
    process.exit(1);
  }
}

// Run the generation
main();
