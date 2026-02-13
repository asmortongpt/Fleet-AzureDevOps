import axios from 'axios';
import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Test endpoint to verify Google Maps API key configuration
 * GET /api/maps/test
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY ||
                   process.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Google Maps API key not configured',
        details: {
          envVars: {
            GOOGLE_MAPS_API_KEY: !!process.env.GOOGLE_MAPS_API_KEY,
            VITE_GOOGLE_MAPS_API_KEY: !!process.env.VITE_GOOGLE_MAPS_API_KEY
          }
        }
      });
    }

    // Test 1: Validate API key format
    const keyFormat = apiKey.startsWith('AIza') ? 'valid' : 'invalid';

    // Test 2: Make a simple Geocoding API request to verify key works
    const testAddress = 'Tallahassee, FL';
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${apiKey}`;

    let geocodeResult;
    try {
      const response = await axios.get(geocodeUrl, { timeout: 5000 });
      geocodeResult = {
        status: response.data.status,
        success: response.data.status === 'OK',
        results: response.data.results?.length || 0,
        location: response.data.results?.[0]?.geometry?.location
      };
    } catch (error: unknown) {
      geocodeResult = {
        status: 'ERROR',
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }

    // Test 3: Check Places API (if needed)
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=Tallahassee&key=${apiKey}`;

    let placesResult;
    try {
      const response = await axios.get(placesUrl, { timeout: 5000 });
      placesResult = {
        status: response.data.status,
        success: response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS',
        results: response.data.results?.length || 0
      };
    } catch (error: unknown) {
      placesResult = {
        status: 'ERROR',
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }

    // Return comprehensive test results
    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      apiKey: {
        configured: true,
        format: keyFormat,
        prefix: apiKey.substring(0, 8) + '...',
        length: apiKey.length
      },
      tests: {
        geocoding: geocodeResult,
        places: placesResult
      },
      recommendations: generateRecommendations(geocodeResult, placesResult),
      integration: {
        frontend: {
          component: 'GoogleMap.tsx',
          location: '/src/components/GoogleMap.tsx',
          status: 'implemented',
          features: [
            'Vehicle markers',
            'Facility markers',
            'Traffic camera markers',
            'Info windows',
            'Clustering support',
            'Multiple map types (roadmap, satellite, hybrid, terrain)'
          ]
        },
        universalMap: {
          component: 'UniversalMap.tsx',
          location: '/src/components/UniversalMap.tsx',
          status: 'implemented',
          features: [
            'Dual provider support (Google Maps + Leaflet)',
            'Automatic fallback to Leaflet on errors',
            'Provider selection API',
            'Performance monitoring'
          ]
        }
      }
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
});

/**
 * Generate recommendations based on API test results
 */
function generateRecommendations(geocodeResult: any, placesResult: any): string[] {
  const recommendations: string[] = [];

  if (!geocodeResult.success) {
    recommendations.push('⚠️ Geocoding API test failed - check API key permissions for Geocoding API');
  }

  if (!placesResult.success) {
    recommendations.push('⚠️ Places API test failed - check API key permissions for Places API');
  }

  if (geocodeResult.success && placesResult.success) {
    recommendations.push('✅ All Google Maps APIs are working correctly');
    recommendations.push('✅ Ready to use GoogleMap component in production');
  }

  recommendations.push('💡 Enable billing in Google Cloud Console for production use');
  recommendations.push('💡 Set up API key restrictions for security (HTTP referrers for web)');
  recommendations.push('💡 Monitor usage in Google Cloud Console to stay within free tier');

  return recommendations;
}

export default router;
