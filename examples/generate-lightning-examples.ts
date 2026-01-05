/**
 * Example Usage Scripts for Ford F-150 Lightning Generator
 *
 * Demonstrates all generation methods and customization options
 */

import FordLightningGenerator, { AdvancedTextureProcessor } from '../meshy-ford-lightning-generator';

// Your Meshy API key from .env
const MESHY_API_KEY = process.env.MESHY_API_KEY || 'msy_aL4JDGCHF76THUL7Ko2WmLMSOG0VfXnLRlw3';

// ============================================================================
// EXAMPLE 1: Generate Stock 2025 Ford Lightning (Text-based)
// ============================================================================

async function example1_GenerateStockLightning() {
  console.log('\n=== EXAMPLE 1: Generate Stock Lightning (Text-based) ===\n');

  const generator = new FordLightningGenerator(MESHY_API_KEY);

  const stockOptions = {
    paintColor: 'Antimatter Blue' as const,
    trim: 'Lariat' as const,
    wheels: '20-inch' as const,
    features: {
      bedLiner: true,
      tonneau_cover: true,
      running_boards: false,
      tow_mirrors: false,
      light_bar: false,
      bed_lights: true,
    },
  };

  try {
    const result = await generator.generateFromText(stockOptions);
    await generator.downloadModel(result, './output/stock_lightning');

    console.log('\n✅ Stock Lightning Generated!');
    console.log(`Task ID: ${result.id}`);
    console.log('Models saved to: ./output/stock_lightning');

    return result.id; // Save for later color changes
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: Generate All Paint Color Variants
// ============================================================================

async function example2_GenerateAllColorVariants() {
  console.log('\n=== EXAMPLE 2: Generate All Paint Color Variants ===\n');

  const generator = new FordLightningGenerator(MESHY_API_KEY);

  const colors = [
    'Antimatter Blue',
    'Avalanche',
    'Iconic Silver',
    'Carbonized Gray',
    'Agate Black',
    'Rapid Red',
    'Atlas Blue',
    'Star White',
  ] as const;

  const baseOptions = {
    trim: 'Platinum' as const,
    wheels: '22-inch' as const,
    features: {
      bedLiner: true,
      tonneau_cover: true,
      running_boards: true,
      tow_mirrors: true,
      light_bar: true,
      bed_lights: true,
    },
  };

  const results: Record<string, string> = {};

  // Generate base model first
  console.log('🚗 Generating base model with first color...');
  const baseModel = await generator.generateFromText({
    ...baseOptions,
    paintColor: colors[0],
  });

  results[colors[0]] = baseModel.id;
  await generator.downloadModel(baseModel, `./output/colors/${colors[0].replace(' ', '_')}`);

  // Use retexture API to quickly generate all other colors
  for (let i = 1; i < colors.length; i++) {
    const color = colors[i];
    console.log(`\n🎨 Generating ${color} variant...`);

    const coloredModel = await generator.changePaintColor(baseModel.id, color);
    results[color] = coloredModel.id;

    await generator.downloadModel(
      coloredModel,
      `./output/colors/${color.replace(' ', '_')}`
    );
  }

  console.log('\n✅ All color variants generated!');
  console.log('Results:', results);

  return results;
}

// ============================================================================
// EXAMPLE 3: Generate from Real Photos (Highest Quality)
// ============================================================================

async function example3_GenerateFromPhotos() {
  console.log('\n=== EXAMPLE 3: Generate from Reference Photos ===\n');

  const generator = new FordLightningGenerator(MESHY_API_KEY);

  // Example: Using publicly available Ford Lightning images
  // Replace with your actual photo URLs or local file paths
  const referenceImages = [
    'https://example.com/lightning_front.jpg',
    'https://example.com/lightning_side.jpg',
    'https://example.com/lightning_rear.jpg',
    'https://example.com/lightning_top.jpg',
  ];

  // Or use local files:
  // const referenceImages = [
  //   '/path/to/photos/front.jpg',
  //   '/path/to/photos/side.jpg',
  //   '/path/to/photos/rear.jpg',
  //   '/path/to/photos/top.jpg',
  // ];

  const options = {
    paintColor: 'Rapid Red' as const,
    trim: 'Lariat' as const,
    wheels: '20-inch' as const,
    features: {
      bedLiner: true,
      tonneau_cover: false,
      running_boards: true,
    },
  };

  try {
    const result = await generator.generateFromImages(referenceImages, options);
    await generator.downloadModel(result, './output/photo_based_lightning');

    console.log('\n✅ Photo-based Lightning Generated!');
    console.log('This model has the highest accuracy based on real photos');

    return result.id;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 4: Apply Custom Paint Color
// ============================================================================

async function example4_CustomPaintColor(baseModelId: string) {
  console.log('\n=== EXAMPLE 4: Apply Custom Paint Color ===\n');

  const generator = new FordLightningGenerator(MESHY_API_KEY);

  // Option A: Custom color by description
  const customByText = await generator.changePaintColor(
    baseModelId,
    'Customize',
    undefined,
    'matte military olive green with black accents, tactical finish, non-reflective coating'
  );

  await generator.downloadModel(customByText, './output/custom_olive_green');

  console.log('\n✅ Custom olive green paint applied!');

  return customByText.id;
}

// ============================================================================
// EXAMPLE 5: Apply Vehicle Wrap from Image
// ============================================================================

async function example5_ApplyVehicleWrap(baseModelId: string) {
  console.log('\n=== EXAMPLE 5: Apply Vehicle Wrap from Image ===\n');

  const generator = new FordLightningGenerator(MESHY_API_KEY);

  // Path to custom wrap design image (e.g., carbon fiber, camo, company logo)
  const wrapImagePath = '/path/to/your/wrap_design.jpg';

  try {
    const result = await generator.applyCustomTexture(baseModelId, wrapImagePath);
    await generator.downloadModel(result, './output/custom_wrap');

    console.log('\n✅ Custom wrap applied!');
    return result.id;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 6: Generate from Video Frames
// ============================================================================

async function example6_GenerateFromVideo() {
  console.log('\n=== EXAMPLE 6: Generate from Video Frames ===\n');

  const generator = new FordLightningGenerator(MESHY_API_KEY);
  const processor = new AdvancedTextureProcessor();

  // Path to video file (e.g., 360° video of the truck)
  const videoPath = '/path/to/lightning_walkaround.mp4';

  try {
    // Extract 4 best frames from video
    const frames = await processor.extractVideoFrames(
      videoPath,
      './temp/video_frames',
      4
    );

    console.log('📸 Extracted frames:', frames);

    // Generate model from video frames
    const options = {
      paintColor: 'Atlas Blue' as const,
      trim: 'XLT' as const,
      wheels: '18-inch' as const,
      features: {},
    };

    const result = await generator.generateFromImages(frames, options);
    await generator.downloadModel(result, './output/video_based_lightning');

    console.log('\n✅ Video-based Lightning Generated!');
    return result.id;
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('💡 Make sure ffmpeg is installed: brew install ffmpeg');
    throw error;
  }
}

// ============================================================================
// EXAMPLE 7: Complete Fleet with All Trims
// ============================================================================

async function example7_GenerateCompleteFleet() {
  console.log('\n=== EXAMPLE 7: Generate Complete Fleet (All Trims) ===\n');

  const generator = new FordLightningGenerator(MESHY_API_KEY);

  const trims = ['Pro', 'XLT', 'Lariat', 'Platinum'] as const;
  const results: Record<string, string> = {};

  for (const trim of trims) {
    console.log(`\n🚗 Generating ${trim} trim...`);

    const options = {
      paintColor: 'Iconic Silver' as const,
      trim,
      wheels: trim === 'Pro' ? '18-inch' as const : '20-inch' as const,
      features: {
        bedLiner: true,
        tonneau_cover: trim !== 'Pro',
        running_boards: trim === 'Lariat' || trim === 'Platinum',
        tow_mirrors: trim === 'Platinum',
        light_bar: trim === 'Platinum',
        bed_lights: trim !== 'Pro',
      },
    };

    const result = await generator.generateFromText(options);
    results[trim] = result.id;

    await generator.downloadModel(result, `./output/fleet/${trim.toLowerCase()}`);
  }

  console.log('\n✅ Complete fleet generated!');
  console.log('Results:', results);

  return results;
}

// ============================================================================
// EXAMPLE 8: LiDAR-Based Ultra-Precision Model
// ============================================================================

async function example8_LidarBasedModel() {
  console.log('\n=== EXAMPLE 8: LiDAR-Based Model (Advanced) ===\n');

  const processor = new AdvancedTextureProcessor();

  // Path to LiDAR scan data (.las, .laz, .ply, etc.)
  const lidarPath = '/path/to/lightning_scan.las';

  console.log('📡 Processing LiDAR data...');
  console.log('\n⚠️  LiDAR workflow requires additional tools:');
  console.log('1. Convert LiDAR point cloud to mesh using:');
  console.log('   - CloudCompare (https://www.cloudcompare.org/)');
  console.log('   - Open3D (pip install open3d)');
  console.log('   - MeshLab (https://www.meshlab.net/)');
  console.log('\n2. Export as .obj, .glb, or .fbx');
  console.log('3. Upload to Meshy Retexture API for texturing');
  console.log('\nExample Open3D script:');
  console.log(`
import open3d as o3d

# Load point cloud
pcd = o3d.io.read_point_cloud("${lidarPath}")

# Estimate normals
pcd.estimate_normals()

# Create mesh using Poisson reconstruction
mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcd, depth=9)

# Save mesh
o3d.io.write_triangle_mesh("lightning_mesh.obj", mesh)
  `);

  await processor.processLidarData(lidarPath);

  console.log('\n💡 After converting LiDAR to mesh, use:');
  console.log('   generator.applyCustomTexture(model_url, texture_image)');
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('🚀 Ford F-150 Lightning 3D Model Generation Examples\n');

  try {
    // Run examples sequentially
    // Uncomment the examples you want to run:

    // Example 1: Basic stock truck
    const stockId = await example1_GenerateStockLightning();

    // Example 2: All color variants (uses retexture for efficiency)
    // await example2_GenerateAllColorVariants();

    // Example 3: From real photos (highest quality)
    // await example3_GenerateFromPhotos();

    // Example 4: Custom paint color
    // await example4_CustomPaintColor(stockId);

    // Example 5: Vehicle wrap
    // await example5_ApplyVehicleWrap(stockId);

    // Example 6: From video
    // await example6_GenerateFromVideo();

    // Example 7: Complete fleet
    // await example7_GenerateCompleteFleet();

    // Example 8: LiDAR workflow
    // await example8_LidarBasedModel();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  example1_GenerateStockLightning,
  example2_GenerateAllColorVariants,
  example3_GenerateFromPhotos,
  example4_CustomPaintColor,
  example5_ApplyVehicleWrap,
  example6_GenerateFromVideo,
  example7_GenerateCompleteFleet,
  example8_LidarBasedModel,
};
