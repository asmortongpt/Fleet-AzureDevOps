/**
 * Meshy.ai Production Integration
 * Generate REAL photo-realistic 3D vehicle models using AI
 */

import fs from 'fs/promises';
import path from 'path';

import axios from 'axios';

const MESHY_API_KEY = process.env.MESHY_API_KEY;
if (!MESHY_API_KEY) {
  throw new Error(
    'MESHY_API_KEY environment variable is required. ' +
    'Please set it in your .env file. ' +
    'Get your API key from: https://meshy.ai/dashboard/api-keys'
  );
}
const MESHY_BASE_URL = 'https://api.meshy.ai';

interface MeshyTaskStatus {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
  model_urls?: {
    glb?: string;
    fbx?: string;
    usdz?: string;
  };
  thumbnail_url?: string;
  progress?: number;
  error?: string;
}

interface VehicleSpec {
  make: string;
  model: string;
  year: number;
  color: string;
  condition: 'pristine' | 'light_damage' | 'medium_damage' | 'heavy_damage';
}

class MeshyAIVehicleGenerator {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = MESHY_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = MESHY_BASE_URL;
  }

  /**
   * Generate photo-realistic vehicle using Text-to-3D
   */
  async generateVehicleFromText(spec: VehicleSpec): Promise<string> {
    console.log(`🚗 Generating ${spec.year} ${spec.make} ${spec.model} (${spec.color})`);

    // Create detailed prompt for realistic vehicle
    const prompt = this.createVehiclePrompt(spec);

    try {
      // Step 1: Create preview (fast, low-poly)
      console.log('   📝 Creating AI preview...');
      const previewTask = await this.createTextTo3DPreview(prompt);

      // Wait for preview
      const preview = await this.waitForCompletion(previewTask.id, 'text-to-3d');
      console.log(`   ✅ Preview complete: ${preview.id}`);

      // Step 2: Refine to high quality
      console.log('   🎨 Refining to photo-realistic quality...');
      const refineTask = await this.createTextTo3DRefine(preview.id);

      // Wait for refined model
      const refined = await this.waitForCompletion(refineTask.id, 'text-to-3d');
      console.log(`   ✅ Refinement complete!`);

      if (refined.model_urls?.glb) {
        // Download the GLB file
        const outputPath = path.join(
          process.cwd(),
          'output',
          'meshy_vehicles',
          `${spec.make}_${spec.model}_${spec.year}_${spec.color}_${spec.condition}.glb`
        );

        await this.downloadModel(refined.model_urls.glb, outputPath);
        console.log(`   💾 Downloaded: ${outputPath}`);

        return outputPath;
      } else {
        throw new Error('No GLB model URL in response');
      }

    } catch (error) {
      console.error('❌ Error generating vehicle:', error);
      throw error;
    }
  }

  /**
   * Generate vehicle from reference image
   */
  async generateVehicleFromImage(imagePath: string, spec: VehicleSpec): Promise<string> {
    console.log(`📸 Generating vehicle from image: ${imagePath}`);

    try {
      // Upload image
      const imageData = await fs.readFile(imagePath);
      const imageBase64 = imageData.toString('base64');

      // Create task
      const response = await axios.post(
        `${this.baseUrl}/v2/image-to-3d`,
        {
          image_url: `data:image/jpeg;base64,${imageBase64}`,
          enable_pbr: true,
          surface_mode: 'hard',
          ai_model: 'meshy-4'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const taskId = response.data.result;
      console.log(`   🔄 Task created: ${taskId}`);

      // Wait for completion
      const result = await this.waitForCompletion(taskId, 'image-to-3d');

      if (result.model_urls?.glb) {
        const outputPath = path.join(
          process.cwd(),
          'output',
          'meshy_vehicles',
          `${spec.make}_${spec.model}_${spec.year}_from_image.glb`
        );

        await this.downloadModel(result.model_urls.glb, outputPath);
        console.log(`   💾 Downloaded: ${outputPath}`);

        return outputPath;
      }

      throw new Error('No model generated');

    } catch (error) {
      console.error('❌ Error generating from image:', error);
      throw error;
    }
  }

  /**
   * Create detailed vehicle prompt
   */
  private createVehiclePrompt(spec: VehicleSpec): string {
    const damageDescriptions = {
      pristine: 'brand new, showroom condition, perfect paint, no scratches',
      light_damage: 'minor scratches and light wear, some paint chips',
      medium_damage: 'visible dents, scratches, moderate paint damage, some rust',
      heavy_damage: 'major dents, heavy scratches, significant rust, broken parts'
    };

    const prompt = `
Ultra-realistic, photo-realistic ${spec.year} ${spec.make} ${spec.model} pickup truck,
${spec.color} paint color,
${damageDescriptions[spec.condition]},
highly detailed,
4K textures,
PBR materials,
accurate proportions,
realistic lighting,
professional automotive photography quality,
detailed wheels with tire tread,
chrome details,
realistic windows and headlights,
complete vehicle exterior,
commercial vehicle render quality
    `.trim().replace(/\s+/g, ' ');

    return prompt;
  }

  /**
   * Create text-to-3D preview task
   */
  private async createTextTo3DPreview(prompt: string): Promise<{ id: string }> {
    const response = await axios.post(
      `${this.baseUrl}/v2/text-to-3d`,
      {
        mode: 'preview',
        prompt: prompt,
        art_style: 'realistic',
        negative_prompt: 'cartoon, low quality, blurry, distorted, unrealistic, toy'
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { id: response.data.result };
  }

  /**
   * Refine preview to high quality
   */
  private async createTextTo3DRefine(previewTaskId: string): Promise<{ id: string }> {
    const response = await axios.post(
      `${this.baseUrl}/v2/text-to-3d`,
      {
        mode: 'refine',
        preview_task_id: previewTaskId,
        enable_pbr: true,
        texture_richness: 'high',
        ai_model: 'meshy-4'
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { id: response.data.result };
  }

  /**
   * Wait for task completion
   */
  private async waitForCompletion(taskId: string, endpoint: string): Promise<MeshyTaskStatus> {
    const maxAttempts = 120; // 10 minutes max
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getTaskStatus(taskId, endpoint);

      console.log(`   ⏳ Status: ${status.status} (${status.progress || 0}%)`);

      if (status.status === 'SUCCEEDED') {
        return status;
      }

      if (status.status === 'FAILED' || status.status === 'EXPIRED') {
        throw new Error(`Task failed: ${status.error || status.status}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Task timeout');
  }

  /**
   * Get task status
   */
  private async getTaskStatus(taskId: string, endpoint: string): Promise<MeshyTaskStatus> {
    const response = await axios.get(
      `${this.baseUrl}/v2/${endpoint}/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );

    return response.data;
  }

  /**
   * Download model file
   */
  private async downloadModel(url: string, outputPath: string): Promise<void> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, response.data);
  }

  /**
   * Get account credits
   */
  async getCredits(): Promise<number> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/account`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.credits || 0;
    } catch (error) {
      console.error('Error fetching credits:', error);
      return 0;
    }
  }
}

// Generate priority vehicles
async function generatePriorityFleet() {
  const generator = new MeshyAIVehicleGenerator();

  console.log('💳 Checking Meshy.ai credits...');
  const credits = await generator.getCredits();
  console.log(`   Available credits: ${credits}`);

  if (credits < 10) {
    console.log('⚠️  Insufficient credits. Please add credits to your Meshy.ai account.');
    console.log('   Visit: https://app.meshy.ai');
    return;
  }

  // Priority vehicles to generate
  const vehicles: VehicleSpec[] = [
    { make: 'Ford', model: 'F-150 Lightning', year: 2025, color: 'Antimatter Blue', condition: 'pristine' },
    { make: 'Ford', model: 'F-150 Lightning', year: 2025, color: 'Oxford White', condition: 'light_damage' },
    { make: 'Chevrolet', model: 'Silverado EV', year: 2025, color: 'Summit White', condition: 'pristine' },
    { make: 'Tesla', model: 'Cybertruck', year: 2024, color: 'Stainless Steel', condition: 'pristine' },
    { make: 'Rivian', model: 'R1T', year: 2025, color: 'Launch Green', condition: 'pristine' },
  ];

  console.log(`\n🚀 Generating ${vehicles.length} photo-realistic vehicles...`);
  console.log('=' * 80);

  for (const vehicle of vehicles) {
    try {
      await generator.generateVehicleFromText(vehicle);
      console.log(`✅ Completed: ${vehicle.make} ${vehicle.model}\n`);
    } catch (error) {
      console.error(`❌ Failed: ${vehicle.make} ${vehicle.model}`);
      console.error(error);
    }
  }

  console.log('\n🎉 Fleet generation complete!');
}

// Export for use
export { MeshyAIVehicleGenerator, generatePriorityFleet };

// Run if executed directly
if (require.main === module) {
  generatePriorityFleet().catch(console.error);
}
