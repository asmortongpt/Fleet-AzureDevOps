/**
 * Generate 2025 Ford F-150 Lightning - Inline Script
 * Direct API call to Meshy.ai without TypeScript compilation
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Your Meshy API key
const MESHY_API_KEY = process.env.MESHY_API_KEY || 'msy_aL4JDGCHF76THUL7Ko2WmLMSOG0VfXnLRlw3';
const BASE_URL = 'https://api.meshy.ai';

// Configuration
const config = {
  paintColor: 'Antimatter Blue',
  trim: 'Lariat',
  wheels: '20-inch',
  features: {
    bedLiner: true,
    tonneau_cover: true,
    running_boards: true,
    bed_lights: true,
  },
};

// Generate detailed prompt
function generatePrompt() {
  return `photo-realistic 2025 Ford F-150 Lightning electric pickup truck, deep metallic antimatter blue automotive paint with subtle metallic flakes premium gloss finish, Lariat luxury trim with premium chrome grille LED signature lighting chrome door handles, 20-inch polished aluminum wheels, spray-in bed liner, black tonneau bed cover, chrome running boards, LED bed lighting, modern electric truck design, distinctive LED light bar across front grille, sleek aerodynamic body, crew cab configuration, 5.5-foot bed, distinctive Lightning badging, studio lighting, professional automotive photography quality, ultra high detail, 4K textures, automotive showroom quality`;
}

function generateNegativePrompt() {
  return 'low quality, blurry, distorted, cartoon, sketch, unrealistic, damaged, rusty, dirty, incorrect proportions, wrong colors, missing parts, deformed, low polygon, watermark, text, logo, bad lighting, overexposed, underexposed';
}

// API client
const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${MESHY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Poll task status
async function pollTaskStatus(taskId, endpoint = 'text-to-3d', maxAttempts = 120, interval = 5000) {
  console.log(`\n⏳ Waiting for task to complete (checking every 5 seconds)...`);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await client.get(`/openapi/v2/${endpoint}/${taskId}`);
      const task = response.data;

      const progress = task.progress || 0;
      console.log(`   [${attempt + 1}/${maxAttempts}] Status: ${task.status}, Progress: ${progress}%`);

      if (task.status === 'SUCCEEDED') {
        console.log('   ✅ Task completed successfully!');
        return task;
      }

      if (task.status === 'FAILED' || task.status === 'CANCELED') {
        throw new Error(`Task failed: ${task.task_error?.message || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      if (error.message.includes('Task failed')) {
        throw error;
      }
      console.log(`   ⚠️  Error checking status: ${error.message}`);
    }
  }

  throw new Error('Task timeout - did not complete within 10 minutes');
}

// Download file
async function downloadFile(url, outputPath) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(outputPath, response.data);
}

// Main generation function
async function generateLightning() {
  console.log('🚗 2025 Ford F-150 Lightning 3D Model Generation');
  console.log('================================================\n');

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
    // Step 1: Create preview (base mesh)
    console.log('🔧 Step 1/2: Creating base mesh geometry...');
    console.log('   Generating preview with 300,000 polygons for maximum detail...\n');

    const previewResponse = await client.post('/openapi/v2/text-to-3d', {
      mode: 'preview',
      prompt: generatePrompt(),
      negative_prompt: generateNegativePrompt(),
      art_style: 'realistic',
      ai_model: 'latest',
      topology: 'quad',
      target_polycount: 300000,
      symmetry_mode: 'auto',
      pose_mode: '',
      should_remesh: true,
    });

    const previewTask = previewResponse.data;
    console.log(`   ✅ Preview task created: ${previewTask.id}`);

    // Wait for preview completion
    const completedPreview = await pollTaskStatus(previewTask.id, 'text-to-3d');

    // Step 2: Add texturing
    console.log('\n🎨 Step 2/2: Adding photo-realistic textures...');
    console.log('   Applying PBR materials (metallic, roughness, normal maps)...\n');

    const refineResponse = await client.post('/openapi/v2/text-to-3d', {
      mode: 'refine',
      preview_task_id: completedPreview.id,
      enable_pbr: true,
      texture_prompt: 'deep metallic antimatter blue automotive paint with subtle metallic flakes, professional automotive paint finish, realistic reflections',
    });

    const refineTask = refineResponse.data;
    console.log(`   ✅ Refine task created: ${refineTask.id}`);

    // Wait for refine completion
    const completedRefine = await pollTaskStatus(refineTask.id, 'text-to-3d');

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n✅ Generation Complete!');
    console.log(`⏱️  Total Time: ${duration} seconds (${Math.round(duration / 60)} minutes)`);
    console.log('');

    console.log('📊 Model Information:');
    console.log(`   Task ID: ${completedRefine.id}`);
    console.log(`   Status: ${completedRefine.status}`);
    console.log('');

    if (completedRefine.model_urls) {
      console.log('🔗 Model URLs:');
      if (completedRefine.model_urls.glb) console.log(`   GLB: ${completedRefine.model_urls.glb}`);
      if (completedRefine.model_urls.fbx) console.log(`   FBX: ${completedRefine.model_urls.fbx}`);
      if (completedRefine.model_urls.obj) console.log(`   OBJ: ${completedRefine.model_urls.obj}`);
      if (completedRefine.model_urls.usdz) console.log(`   USDZ: ${completedRefine.model_urls.usdz}`);
      console.log('');
    }

    if (completedRefine.texture_urls) {
      console.log('🎨 Texture URLs:');
      if (completedRefine.texture_urls.base_color) console.log(`   Base Color: ${completedRefine.texture_urls.base_color}`);
      if (completedRefine.texture_urls.metallic) console.log(`   Metallic: ${completedRefine.texture_urls.metallic}`);
      if (completedRefine.texture_urls.roughness) console.log(`   Roughness: ${completedRefine.texture_urls.roughness}`);
      if (completedRefine.texture_urls.normal) console.log(`   Normal: ${completedRefine.texture_urls.normal}`);
      console.log('');
    }

    if (completedRefine.thumbnail_url) {
      console.log(`🖼️  Thumbnail: ${completedRefine.thumbnail_url}`);
      console.log('');
    }

    // Download the model files
    const outputDir = './output/lightning_generation';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`💾 Downloading model files to ${outputDir}...`);

    const downloads = [];

    if (completedRefine.model_urls) {
      if (completedRefine.model_urls.glb) {
        downloads.push({ format: 'glb', url: completedRefine.model_urls.glb });
      }
      if (completedRefine.model_urls.fbx) {
        downloads.push({ format: 'fbx', url: completedRefine.model_urls.fbx });
      }
      if (completedRefine.model_urls.obj) {
        downloads.push({ format: 'obj', url: completedRefine.model_urls.obj });
      }
      if (completedRefine.model_urls.usdz) {
        downloads.push({ format: 'usdz', url: completedRefine.model_urls.usdz });
      }
    }

    for (const { format, url } of downloads) {
      const filename = path.join(outputDir, `ford_lightning_${completedRefine.id}.${format}`);
      console.log(`   Downloading ${format.toUpperCase()}...`);
      await downloadFile(url, filename);
      console.log(`   ✅ ${filename}`);
    }

    // Download textures
    if (completedRefine.texture_urls) {
      const textureDir = path.join(outputDir, 'textures');
      if (!fs.existsSync(textureDir)) {
        fs.mkdirSync(textureDir, { recursive: true });
      }

      const textures = [
        { name: 'base_color', url: completedRefine.texture_urls.base_color },
        { name: 'metallic', url: completedRefine.texture_urls.metallic },
        { name: 'roughness', url: completedRefine.texture_urls.roughness },
        { name: 'normal', url: completedRefine.texture_urls.normal },
      ];

      for (const { name, url } of textures) {
        if (url) {
          const filename = path.join(textureDir, `${name}_${completedRefine.id}.png`);
          console.log(`   Downloading ${name} texture...`);
          await downloadFile(url, filename);
          console.log(`   ✅ ${filename}`);
        }
      }
    }

    // Save metadata
    const metadata = {
      taskId: completedRefine.id,
      configuration: config,
      generatedAt: new Date().toISOString(),
      duration: duration,
      modelUrls: completedRefine.model_urls,
      textureUrls: completedRefine.texture_urls,
      thumbnailUrl: completedRefine.thumbnail_url,
    };

    fs.writeFileSync(
      path.join(outputDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('');
    console.log('📁 Files created:');
    const files = fs.readdirSync(outputDir);
    files.forEach(file => {
      const filePath = path.join(outputDir, file);
      if (fs.statSync(filePath).isFile()) {
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`   ✓ ${file} (${sizeMB} MB)`);
      }
    });

    console.log('');
    console.log('🎉 Success! Your 2025 Ford F-150 Lightning 3D model is ready!');
    console.log('');
    console.log('📖 Next Steps:');
    console.log('   1. View GLB: https://gltf-viewer.donmccurdy.com/');
    console.log(`   2. Local path: ${path.resolve(outputDir)}`);
    console.log('   3. Import into Blender, Unity, Unreal, etc.');
    console.log('   4. Use in your fleet management app');
    console.log('');

  } catch (error) {
    console.error('\n❌ Generation Failed!');
    console.error('Error:', error.message);
    console.error('');

    if (error.response) {
      console.error('API Response:', error.response.data);
      console.error('Status:', error.response.status);
    }

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
generateLightning();
