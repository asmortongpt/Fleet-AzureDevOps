/**
 * Meshy.ai Ford F-150 Lightning 3D Model Generator
 *
 * Generates high-resolution, photo-realistic 2025 Ford F-150 Lightning models
 * with customizable paint colors, features, and advanced texture inputs
 * from images, videos, and LiDAR data.
 */

import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Configuration & Types
// ============================================================================

interface MeshyConfig {
  apiKey: string;
  baseUrl?: string;
}

interface TextTo3DPreviewRequest {
  mode: 'preview';
  prompt: string;
  negative_prompt?: string;
  art_style: 'realistic' | 'sculpture';
  ai_model: 'meshy-4' | 'meshy-5' | 'latest';
  topology?: 'quad' | 'triangle';
  target_polycount?: number; // 100-300,000
  symmetry_mode?: 'off' | 'auto' | 'on';
  pose_mode?: 'a-pose' | 't-pose' | '';
  should_remesh?: boolean;
}

interface TextTo3DRefineRequest {
  mode: 'refine';
  preview_task_id: string;
  enable_pbr?: boolean;
  texture_prompt?: string;
  texture_image_url?: string;
}

interface ImageTo3DRequest {
  image_url: string;
  ai_model?: 'meshy-4' | 'meshy-5' | 'latest';
  should_texture?: boolean;
  texture_prompt?: string;
  texture_image_url?: string;
  enable_pbr?: boolean;
  topology?: 'quad' | 'triangle';
  target_polycount?: number;
  save_pre_remeshed_model?: boolean;
  moderation?: boolean;
}

interface MultiImageTo3DRequest {
  image_urls: string[]; // 1-4 images
  ai_model?: 'meshy-4' | 'meshy-5' | 'latest';
  enable_pbr?: boolean;
  target_polycount?: number;
}

interface RetextureRequest {
  input_task_id?: string;
  model_url?: string;
  text_style_prompt?: string;
  image_style_url?: string;
  ai_model?: 'meshy-4' | 'meshy-5' | 'latest';
  enable_original_uv?: boolean;
  enable_pbr?: boolean;
}

interface TaskStatus {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  progress: number;
  model_urls?: {
    glb?: string;
    fbx?: string;
    obj?: string;
    usdz?: string;
  };
  texture_urls?: {
    base_color?: string;
    metallic?: string;
    roughness?: string;
    normal?: string;
  };
  thumbnail_url?: string;
  created_at?: number;
  finished_at?: number;
  task_error?: {
    message: string;
  };
}

interface FordLightningOptions {
  // Paint colors
  paintColor: 'Antimatter Blue' | 'Avalanche' | 'Iconic Silver' | 'Carbonized Gray' |
              'Agate Black' | 'Rapid Red' | 'Atlas Blue' | 'Star White' | 'Customize';
  customPaintHex?: string;
  customPaintDescription?: string;

  // Trim level
  trim: 'Pro' | 'XLT' | 'Lariat' | 'Platinum';

  // Wheel options
  wheels: '18-inch' | '20-inch' | '22-inch';

  // Features
  features: {
    bedLiner?: boolean;
    tonneau_cover?: boolean;
    running_boards?: boolean;
    tow_mirrors?: boolean;
    light_bar?: boolean;
    bed_lights?: boolean;
  };

  // Texture input sources
  textureInputs?: {
    images?: string[]; // URLs or file paths
    videoFrames?: string[]; // Extracted video frames
    lidarData?: string; // LiDAR point cloud data
  };
}

// ============================================================================
// Meshy API Client
// ============================================================================

export class MeshyClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: MeshyConfig) {
    this.apiKey = config.apiKey;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.meshy.ai',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // ------------------------------------------------------------------------
  // Text to 3D
  // ------------------------------------------------------------------------

  async createTextTo3DPreview(request: TextTo3DPreviewRequest): Promise<TaskStatus> {
    const response = await this.client.post('/openapi/v2/text-to-3d', request);
    return response.data;
  }

  async createTextTo3DRefine(request: TextTo3DRefineRequest): Promise<TaskStatus> {
    const response = await this.client.post('/openapi/v2/text-to-3d', request);
    return response.data;
  }

  async getTextTo3DTask(taskId: string): Promise<TaskStatus> {
    const response = await this.client.get(`/openapi/v2/text-to-3d/${taskId}`);
    return response.data;
  }

  // ------------------------------------------------------------------------
  // Image to 3D
  // ------------------------------------------------------------------------

  async createImageTo3D(request: ImageTo3DRequest): Promise<TaskStatus> {
    const response = await this.client.post('/openapi/v1/image-to-3d', request);
    return response.data;
  }

  async createMultiImageTo3D(request: MultiImageTo3DRequest): Promise<TaskStatus> {
    const response = await this.client.post('/openapi/v1/multi-image-to-3d', request);
    return response.data;
  }

  async getImageTo3DTask(taskId: string): Promise<TaskStatus> {
    const response = await this.client.get(`/openapi/v1/image-to-3d/${taskId}`);
    return response.data;
  }

  // ------------------------------------------------------------------------
  // Retexture
  // ------------------------------------------------------------------------

  async createRetexture(request: RetextureRequest): Promise<TaskStatus> {
    const response = await this.client.post('/openapi/v1/retexture', request);
    return response.data;
  }

  async getRetextureTask(taskId: string): Promise<TaskStatus> {
    const response = await this.client.get(`/openapi/v1/retexture/${taskId}`);
    return response.data;
  }

  // ------------------------------------------------------------------------
  // Polling Helper
  // ------------------------------------------------------------------------

  async waitForTaskCompletion(
    taskId: string,
    endpoint: 'text-to-3d' | 'image-to-3d' | 'retexture',
    maxAttempts: number = 120,
    pollInterval: number = 5000
  ): Promise<TaskStatus> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let task: TaskStatus;

      switch (endpoint) {
        case 'text-to-3d':
          task = await this.getTextTo3DTask(taskId);
          break;
        case 'image-to-3d':
          task = await this.getImageTo3DTask(taskId);
          break;
        case 'retexture':
          task = await this.getRetextureTask(taskId);
          break;
      }

      console.log(`Task ${taskId} - Status: ${task.status}, Progress: ${task.progress}%`);

      if (task.status === 'SUCCEEDED') {
        return task;
      }

      if (task.status === 'FAILED' || task.status === 'CANCELED') {
        throw new Error(`Task failed: ${task.task_error?.message || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Task ${taskId} did not complete within ${maxAttempts * pollInterval / 1000} seconds`);
  }

  // ------------------------------------------------------------------------
  // File Upload Helper (for base64 conversion)
  // ------------------------------------------------------------------------

  async uploadImageAsDataUri(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  }
}

// ============================================================================
// Ford F-150 Lightning Generator
// ============================================================================

export class FordLightningGenerator {
  private meshyClient: MeshyClient;

  constructor(apiKey: string) {
    this.meshyClient = new MeshyClient({ apiKey });
  }

  /**
   * Paint color descriptions for accurate texturing
   */
  private getPaintColorDescription(color: string, customHex?: string, customDesc?: string): string {
    const paintColors: Record<string, string> = {
      'Antimatter Blue': 'deep metallic antimatter blue automotive paint with subtle metallic flakes, premium gloss finish',
      'Avalanche': 'bright white avalanche automotive paint, clean and pristine, high gloss clearcoat',
      'Iconic Silver': 'iconic silver metallic automotive paint, sophisticated grey-silver with metallic shimmer',
      'Carbonized Gray': 'dark carbonized gray metallic paint, charcoal grey with subtle metallic particles',
      'Agate Black': 'deep agate black automotive paint, glossy jet black with clearcoat shine',
      'Rapid Red': 'vibrant rapid red metallic paint, rich crimson red with metallic depth',
      'Atlas Blue': 'atlas blue metallic automotive paint, medium blue with metallic highlights',
      'Star White': 'star white tri-coat automotive paint, brilliant white with three-layer depth',
    };

    if (color === 'Customize' && customDesc) {
      return customDesc;
    }

    return paintColors[color] || paintColors['Avalanche'];
  }

  /**
   * Get feature description for model generation
   */
  private getFeatureDescription(options: FordLightningOptions): string {
    const features: string[] = [];

    // Trim-specific details
    const trimDetails: Record<string, string> = {
      'Pro': 'work truck trim with steel wheels, basic grille, halogen headlights',
      'XLT': 'XLT trim with chrome grille, LED headlights, body-color bumpers',
      'Lariat': 'Lariat luxury trim with premium chrome grille, LED signature lighting, chrome door handles',
      'Platinum': 'Platinum premium trim with unique grille design, premium LED lighting, chrome accents',
    };
    features.push(trimDetails[options.trim]);

    // Wheel options
    const wheelDetails: Record<string, string> = {
      '18-inch': '18-inch silver steel wheels',
      '20-inch': '20-inch polished aluminum wheels',
      '22-inch': '22-inch premium machined aluminum wheels',
    };
    features.push(wheelDetails[options.wheels]);

    // Optional features
    if (options.features.bedLiner) features.push('spray-in bed liner');
    if (options.features.tonneau_cover) features.push('black tonneau bed cover');
    if (options.features.running_boards) features.push('chrome running boards');
    if (options.features.tow_mirrors) features.push('power-folding tow mirrors');
    if (options.features.light_bar) features.push('LED light bar on roof');
    if (options.features.bed_lights) features.push('LED bed lighting');

    return features.join(', ');
  }

  /**
   * Generate comprehensive prompt for Ford F-150 Lightning
   */
  private generatePrompt(options: FordLightningOptions): string {
    const paintDesc = this.getPaintColorDescription(
      options.paintColor,
      options.customPaintHex,
      options.customPaintDescription
    );
    const featureDesc = this.getFeatureDescription(options);

    return `photo-realistic 2025 Ford F-150 Lightning electric pickup truck, ${paintDesc}, ${featureDesc},
    modern electric truck design, distinctive LED light bar across front grille, sleek aerodynamic body,
    crew cab configuration, 5.5-foot bed, distinctive Lightning badging,
    studio lighting, professional automotive photography quality,
    ultra high detail, 4K textures, automotive showroom quality`;
  }

  /**
   * Generate negative prompt to avoid unwanted features
   */
  private generateNegativePrompt(): string {
    return 'low quality, blurry, distorted, cartoon, sketch, unrealistic, damaged, rusty, dirty, ' +
           'incorrect proportions, wrong colors, missing parts, deformed, low polygon, ' +
           'watermark, text, logo, bad lighting, overexposed, underexposed';
  }

  /**
   * OPTION 1: Generate from text description (fastest, less accurate)
   */
  async generateFromText(options: FordLightningOptions): Promise<TaskStatus> {
    console.log('🚗 Generating 2025 Ford F-150 Lightning from text description...');

    const prompt = this.generatePrompt(options);
    const negativePrompt = this.generateNegativePrompt();

    console.log(`📝 Prompt: ${prompt.substring(0, 150)}...`);

    // Step 1: Create preview (base mesh)
    console.log('⚙️  Step 1/2: Creating base mesh geometry...');
    const previewTask = await this.meshyClient.createTextTo3DPreview({
      mode: 'preview',
      prompt,
      negative_prompt: negativePrompt,
      art_style: 'realistic',
      ai_model: 'latest', // Meshy-6 Preview for highest quality
      topology: 'quad',
      target_polycount: 300000, // Maximum for highest detail
      symmetry_mode: 'auto',
      pose_mode: '',
      should_remesh: true,
    });

    console.log(`✅ Preview task created: ${previewTask.id}`);

    // Wait for preview completion
    const completedPreview = await this.meshyClient.waitForTaskCompletion(
      previewTask.id,
      'text-to-3d'
    );

    console.log('✅ Base mesh completed!');

    // Step 2: Add texturing
    console.log('⚙️  Step 2/2: Adding photo-realistic textures...');
    const refineTask = await this.meshyClient.createTextTo3DRefine({
      mode: 'refine',
      preview_task_id: completedPreview.id,
      enable_pbr: true, // Enable PBR maps for photo-realism
      texture_prompt: `${this.getPaintColorDescription(options.paintColor, options.customPaintHex, options.customPaintDescription)}, professional automotive paint finish, realistic reflections`,
    });

    console.log(`✅ Refine task created: ${refineTask.id}`);

    // Wait for refine completion
    const completedRefine = await this.meshyClient.waitForTaskCompletion(
      refineTask.id,
      'text-to-3d'
    );

    console.log('✅ Texturing completed!');
    console.log('📦 Model URLs:', completedRefine.model_urls);

    return completedRefine;
  }

  /**
   * OPTION 2: Generate from reference images (RECOMMENDED - highest quality)
   */
  async generateFromImages(
    imageUrls: string[],
    options: FordLightningOptions
  ): Promise<TaskStatus> {
    console.log('🚗 Generating 2025 Ford F-150 Lightning from reference images...');
    console.log(`📸 Using ${imageUrls.length} reference images`);

    if (imageUrls.length < 1 || imageUrls.length > 4) {
      throw new Error('Multi-image to 3D requires 1-4 images');
    }

    // Convert local file paths to data URIs if needed
    const processedUrls = await Promise.all(
      imageUrls.map(async (url) => {
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
          return url;
        }
        // Local file - convert to data URI
        return await this.meshyClient.uploadImageAsDataUri(url);
      })
    );

    const task = await this.meshyClient.createMultiImageTo3D({
      image_urls: processedUrls,
      ai_model: 'latest', // Meshy-6 Preview
      enable_pbr: true,
      target_polycount: 300000, // Maximum resolution
    });

    console.log(`✅ Task created: ${task.id}`);

    // Wait for completion
    const completed = await this.meshyClient.waitForTaskCompletion(
      task.id,
      'image-to-3d'
    );

    console.log('✅ Generation completed!');
    console.log('📦 Model URLs:', completed.model_urls);

    return completed;
  }

  /**
   * OPTION 3: Apply new paint color to existing model
   */
  async changePaintColor(
    modelTaskId: string,
    newColor: FordLightningOptions['paintColor'],
    customHex?: string,
    customDesc?: string
  ): Promise<TaskStatus> {
    console.log(`🎨 Changing paint color to ${newColor}...`);

    const paintDesc = this.getPaintColorDescription(newColor, customHex, customDesc);

    const task = await this.meshyClient.createRetexture({
      input_task_id: modelTaskId,
      text_style_prompt: `${paintDesc}, automotive paint finish, high gloss clearcoat, professional finish, realistic reflections and highlights, showroom quality`,
      ai_model: 'latest',
      enable_original_uv: true,
      enable_pbr: true,
    });

    console.log(`✅ Retexture task created: ${task.id}`);

    const completed = await this.meshyClient.waitForTaskCompletion(
      task.id,
      'retexture'
    );

    console.log('✅ Paint color changed!');
    console.log('📦 Model URLs:', completed.model_urls);

    return completed;
  }

  /**
   * OPTION 4: Apply texture from reference image (for custom paint/wraps)
   */
  async applyCustomTexture(
    modelTaskId: string,
    textureImageUrl: string
  ): Promise<TaskStatus> {
    console.log('🎨 Applying custom texture from image...');

    // Convert local file to data URI if needed
    const processedUrl = textureImageUrl.startsWith('http://') ||
                        textureImageUrl.startsWith('https://') ||
                        textureImageUrl.startsWith('data:')
      ? textureImageUrl
      : await this.meshyClient.uploadImageAsDataUri(textureImageUrl);

    const task = await this.meshyClient.createRetexture({
      input_task_id: modelTaskId,
      image_style_url: processedUrl,
      ai_model: 'latest',
      enable_original_uv: true,
      enable_pbr: true,
    });

    console.log(`✅ Retexture task created: ${task.id}`);

    const completed = await this.meshyClient.waitForTaskCompletion(
      task.id,
      'retexture'
    );

    console.log('✅ Custom texture applied!');
    console.log('📦 Model URLs:', completed.model_urls);

    return completed;
  }

  /**
   * Download model files to local storage
   */
  async downloadModel(task: TaskStatus, outputDir: string): Promise<void> {
    if (!task.model_urls) {
      throw new Error('No model URLs available');
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`💾 Downloading models to ${outputDir}...`);

    const downloads: Array<{ format: string; url: string }> = [];

    if (task.model_urls.glb) downloads.push({ format: 'glb', url: task.model_urls.glb });
    if (task.model_urls.fbx) downloads.push({ format: 'fbx', url: task.model_urls.fbx });
    if (task.model_urls.obj) downloads.push({ format: 'obj', url: task.model_urls.obj });
    if (task.model_urls.usdz) downloads.push({ format: 'usdz', url: task.model_urls.usdz });

    for (const { format, url } of downloads) {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const filename = path.join(outputDir, `ford_lightning_${task.id}.${format}`);
      fs.writeFileSync(filename, response.data);
      console.log(`✅ Downloaded: ${filename}`);
    }

    // Download textures if available
    if (task.texture_urls) {
      const textureDir = path.join(outputDir, 'textures');
      if (!fs.existsSync(textureDir)) {
        fs.mkdirSync(textureDir, { recursive: true });
      }

      const textures = [
        { name: 'base_color', url: task.texture_urls.base_color },
        { name: 'metallic', url: task.texture_urls.metallic },
        { name: 'roughness', url: task.texture_urls.roughness },
        { name: 'normal', url: task.texture_urls.normal },
      ];

      for (const { name, url } of textures) {
        if (url) {
          const response = await axios.get(url, { responseType: 'arraybuffer' });
          const filename = path.join(textureDir, `${name}_${task.id}.png`);
          fs.writeFileSync(filename, response.data);
          console.log(`✅ Downloaded texture: ${filename}`);
        }
      }
    }

    console.log('✅ All files downloaded!');
  }
}

// ============================================================================
// Advanced Features: Video & LiDAR Processing
// ============================================================================

export class AdvancedTextureProcessor {
  /**
   * Extract frames from video for multi-view generation
   * Requires ffmpeg installed: brew install ffmpeg
   */
  async extractVideoFrames(
    videoPath: string,
    outputDir: string,
    frameCount: number = 4
  ): Promise<string[]> {
    console.log(`🎥 Extracting ${frameCount} frames from video...`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Extract evenly spaced frames
    const framePattern = path.join(outputDir, 'frame_%03d.jpg');
    await execAsync(
      `ffmpeg -i "${videoPath}" -vf "select=not(mod(n\\,$(ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "${videoPath}" | awk '{print int($1/${frameCount})}')),scale=1920:1080" -vsync vfr -q:v 2 "${framePattern}"`
    );

    // Get extracted frame paths
    const frames = fs.readdirSync(outputDir)
      .filter((f: string) => f.startsWith('frame_') && f.endsWith('.jpg'))
      .sort()
      .slice(0, frameCount)
      .map((f: string) => path.join(outputDir, f));

    console.log(`✅ Extracted ${frames.length} frames`);
    return frames;
  }

  /**
   * Process LiDAR data for ultra-precise geometry
   * Note: This is a placeholder for LiDAR integration
   * Actual implementation would require point cloud processing libraries
   */
  async processLidarData(lidarPath: string): Promise<string> {
    console.log('📡 Processing LiDAR data...');
    console.log('⚠️  LiDAR processing requires specialized point cloud libraries');
    console.log('💡 Consider using CloudCompare, PCL, or Open3D for point cloud to mesh conversion');
    console.log('💡 Convert LiDAR (.las, .laz, .ply) to mesh (.obj, .glb) before uploading to Meshy');

    // For now, return the path for manual processing
    return lidarPath;
  }
}

// ============================================================================
// Export
// ============================================================================

export default FordLightningGenerator;
