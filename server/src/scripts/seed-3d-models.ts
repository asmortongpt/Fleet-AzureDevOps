/**
 * Seed 3D Vehicle Models
 * Populates the database with initial 3D models from Sketchfab
 * MIGRATED TO DRIZZLE ORM - All queries now use type-safe Drizzle operations
 */

import { Pool } from 'pg';
import { db } from '../../../api/src/db';
import { vehicle3dModels } from '../../../api/src/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getSketchfabService } from '../services/sketchfab';
import { getAzureBlobService } from '../services/azure-blob';
import { logger } from '../services/logger';

interface ModelToSeed {
  searchQuery: string;
  vehicleType: string;
  tags: string[];
  limit?: number;
}

// Predefined model searches
const MODELS_TO_SEED: ModelToSeed[] = [
  { searchQuery: 'sedan car', vehicleType: 'sedan', tags: ['sedan', 'passenger'], limit: 5 },
  { searchQuery: 'suv vehicle', vehicleType: 'suv', tags: ['suv', '4x4'], limit: 5 },
  { searchQuery: 'pickup truck', vehicleType: 'truck', tags: ['truck', 'commercial'], limit: 5 },
  { searchQuery: 'delivery van', vehicleType: 'van', tags: ['van', 'commercial', 'delivery'], limit: 3 },
  { searchQuery: 'police car', vehicleType: 'sedan', tags: ['emergency', 'police'], limit: 2 },
  { searchQuery: 'ambulance vehicle', vehicleType: 'van', tags: ['emergency', 'ambulance'], limit: 2 },
  { searchQuery: 'fire truck', vehicleType: 'truck', tags: ['emergency', 'fire'], limit: 2 },
  { searchQuery: 'sports car', vehicleType: 'coupe', tags: ['sports', 'performance'], limit: 2 },
];

export async function seedVehicle3DModels(pool?: Pool): Promise<void> {
  try {
    logger.info('🚗 Starting 3D vehicle models seeding...');

    const sketchfab = getSketchfabService();
    const azureBlob = getAzureBlobService();

    // Ensure Azure container is initialized
    await azureBlob.initializeContainer();

    let totalImported = 0;
    let totalSkipped = 0;

    for (const modelSearch of MODELS_TO_SEED) {
      logger.info(`Searching Sketchfab: "${modelSearch.searchQuery}"`);

      try {
        const searchResults = await sketchfab.searchVehicles(modelSearch.searchQuery, {
          license: 'CC0', // Free to use, no attribution required
          downloadable: true,
          limit: modelSearch.limit || 5,
        });

        logger.info(`Found ${searchResults.results.length} models for "${modelSearch.searchQuery}"`);

        for (const sketchfabModel of searchResults.results) {
          try {
            // Check if model already exists using Drizzle
            const existingModel = await db
              .select({ id: vehicle3dModels.id })
              .from(vehicle3dModels)
              .where(eq(vehicle3dModels.sourceId, sketchfabModel.uid))
              .limit(1);

            if (existingModel.length > 0) {
              logger.info(`Model ${sketchfabModel.name} already exists, skipping`);
              totalSkipped++;
              continue;
            }

            // Extract thumbnail
            const thumbnail = sketchfabModel.thumbnails.images[
              sketchfabModel.thumbnails.images.length - 1
            ]?.url;

            // Try to download and upload to Azure
            let fileUrl = sketchfabModel.viewerUrl;
            let source = 'sketchfab';
            let fileSizeMb: string | null = null;

            try {
              logger.info(`Downloading model: ${sketchfabModel.name}`);
              const tempPath = `/tmp/${sketchfabModel.uid}.glb`;

              await sketchfab.downloadModel(sketchfabModel.uid, tempPath);

              logger.info(`Uploading to Azure: ${sketchfabModel.name}`);
              const uploadResult = await azureBlob.uploadFromFile(tempPath, {
                fileName: `sketchfab_${sketchfabModel.uid}.glb`,
                metadata: {
                  sketchfabUid: sketchfabModel.uid,
                  sketchfabAuthor: sketchfabModel.user.username,
                  vehicleType: modelSearch.vehicleType,
                },
                tags: {
                  source: 'sketchfab',
                  vehicleType: modelSearch.vehicleType,
                },
              });

              fileUrl = uploadResult.cdnUrl;
              source = 'azure-blob';
              fileSizeMb = (uploadResult.size / (1024 * 1024)).toFixed(2);

              // Clean up temp file
              const fs = await import('fs/promises');
              await fs.unlink(tempPath);

              logger.info(`Successfully uploaded to Azure: ${uploadResult.cdnUrl}`);
            } catch (downloadError: any) {
              logger.warn(
                `Could not download/upload model ${sketchfabModel.name}: ${downloadError.message}. Using Sketchfab URL.`
              );
            }

            // Insert into database using Drizzle
            await db.insert(vehicle3dModels).values({
              name: sketchfabModel.name,
              description: sketchfabModel.description || null,
              vehicleType: modelSearch.vehicleType,
              fileUrl,
              fileFormat: 'glb',
              fileSizeMb,
              polyCount: sketchfabModel.faceCount || null,
              source,
              sourceId: sketchfabModel.uid,
              license: sketchfabModel.license.label,
              licenseUrl: sketchfabModel.license.url,
              author: sketchfabModel.user.displayName,
              authorUrl: sketchfabModel.user.profileUrl,
              thumbnailUrl: thumbnail,
              qualityTier: 'medium',
              hasPbrMaterials: true,
              isFeatured: false,
              tags: modelSearch.tags,
              viewCount: sketchfabModel.viewCount || 0,
              downloadCount: sketchfabModel.downloadCount || 0,
              isActive: true,
            });

            logger.info(`✅ Imported: ${sketchfabModel.name}`);
            totalImported++;

            // Rate limiting - wait 1 second between downloads
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (modelError: any) {
            logger.error(`Failed to import model ${sketchfabModel.name}: ${modelError.message}`);
          }
        }
      } catch (searchError: any) {
        logger.error(`Search error for "${modelSearch.searchQuery}": ${searchError.message}`);
      }
    }

    // Mark featured models using Drizzle
    // Get top 10 models by weighted score
    const topModels = await db
      .select({ id: vehicle3dModels.id })
      .from(vehicle3dModels)
      .where(eq(vehicle3dModels.isActive, true))
      .orderBy(
        desc(
          sql`(${vehicle3dModels.viewCount} * 0.3 + ${vehicle3dModels.downloadCount} * 0.7)`
        )
      )
      .limit(10);

    // Update featured status for top models
    if (topModels.length > 0) {
      const topModelIds = topModels.map(m => m.id);
      await db
        .update(vehicle3dModels)
        .set({ isFeatured: true })
        .where(sql`${vehicle3dModels.id} = ANY(${topModelIds})`);
    }

    logger.info(`
    ✨ Seeding complete!
    📦 Total imported: ${totalImported}
    ⏭️  Total skipped: ${totalSkipped}
    `);
  } catch (error) {
    logger.error('Error seeding 3D models:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await seedVehicle3DModels();
      process.exit(0);
    } catch (error) {
      console.error('Seeding failed:', error);
      process.exit(1);
    }
  })();
}

export default seedVehicle3DModels;
