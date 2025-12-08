/**
 * Seed 3D Vehicle Models
 * Populates the database with initial 3D models from Sketchfab
 */

import { Pool } from 'pg';

import { getAzureBlobService } from '../services/azure-blob';
import { logger } from '../services/logger';
import { getSketchfabService } from '../services/sketchfab';

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

export async function seedVehicle3DModels(pool: Pool): Promise<void> {
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
            // Check if model already exists
            const existingModel = await pool.query(
              'SELECT id FROM vehicle_3d_models WHERE source_id = $1',
              [sketchfabModel.uid]
            );

            if (existingModel.rows.length > 0) {
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
            let fileSizeMb = null;

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

            // Insert into database
            await pool.query(
              `INSERT INTO vehicle_3d_models (
                name, description, vehicle_type,
                file_url, file_format, file_size_mb, poly_count,
                source, source_id, license, license_url,
                author, author_url, thumbnail_url,
                quality_tier, has_pbr_materials, is_featured,
                tags, view_count, download_count
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
              [
                sketchfabModel.name,
                sketchfabModel.description || null,
                modelSearch.vehicleType,
                fileUrl,
                'glb',
                fileSizeMb,
                sketchfabModel.faceCount || null,
                source,
                sketchfabModel.uid,
                sketchfabModel.license.label,
                sketchfabModel.license.url,
                sketchfabModel.user.displayName,
                sketchfabModel.user.profileUrl,
                thumbnail,
                'medium',
                true,
                false,
                modelSearch.tags,
                sketchfabModel.viewCount || 0,
                sketchfabModel.downloadCount || 0,
              ]
            );

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

    // Mark featured models
    await pool.query(`
      UPDATE vehicle_3d_models
      SET is_featured = true
      WHERE id IN (
        SELECT id FROM vehicle_3d_models
        WHERE is_active = true
        ORDER BY (view_count * 0.3 + download_count * 0.7) DESC
        LIMIT 10
      )
    `);

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
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://localhost:5432/fleet_management',
    });

    try {
      await seedVehicle3DModels(pool);
      process.exit(0);
    } catch (error) {
      console.error('Seeding failed:', error);
      process.exit(1);
    } finally {
      await pool.end();
    }
  })();
}

export default seedVehicle3DModels;
