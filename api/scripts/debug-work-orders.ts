/**
 * Debug test for work-orders endpoint
 */
import { FIPSJWTService } from '../src/services/fips-jwt.service';

async function testWorkOrdersEndpoint() {
    const token = FIPSJWTService.generateAccessToken(
        'test-user-001',
        'test@ctafleet.com',
        'admin',
        '874954c7-b68b-5485-8ddd-183932497849'
    );
    console.log('Generated token successfully');
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    console.log('');

    try {
        const response = await fetch('http://localhost:3001/api/work-orders', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testWorkOrdersEndpoint();
