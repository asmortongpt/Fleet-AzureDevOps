/**
 * Test script to verify EXIF stripping functionality
 * This verifies that the sharp-based implementation correctly removes GPS data
 */


import sharp from 'sharp'

import { stripEXIFData } from './src/utils/securityUtils'

async function testExifStripping() {
  console.log('=== EXIF Stripping Security Test ===\n')

  // Create a test image with metadata (using simpler approach)
  console.log('1. Creating test image with EXIF data...')

  // First create a basic image
  const basicImage = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 255, g: 0, b: 0 }
    }
  })
    .jpeg({ quality: 90 })
    .toBuffer()

  // Add simple EXIF metadata
  const testImage = await sharp(basicImage)
    .withMetadata({
      exif: {
        IFD0: {
          Make: 'Test Camera Manufacturer',
          Model: 'Security Test 3000 Pro',
          Software: 'Vulnerable Software v1.0',
          Copyright: 'Sensitive Copyright Info'
        }
      }
    })
    .toBuffer()

  console.log(`   Original image size: ${testImage.length} bytes`)

  // Check metadata BEFORE stripping
  const metadataBefore = await sharp(testImage).metadata()
  console.log('\n2. Metadata BEFORE stripping:')
  console.log(`   Has EXIF: ${metadataBefore.exif !== undefined}`)
  console.log(`   Has IPTC: ${metadataBefore.iptc !== undefined}`)
  console.log(`   Has XMP: ${metadataBefore.xmp !== undefined}`)

  if (metadataBefore.exif) {
    console.log('   ⚠️  SECURITY RISK: Image contains EXIF data (may include GPS)')
  }

  // Strip EXIF using our security function
  console.log('\n3. Stripping metadata using stripEXIFData()...')
  let cleanImage: Buffer
  try {
    cleanImage = await stripEXIFData(testImage)
    console.log(`   ✓ Stripping succeeded`)
    console.log(`   Clean image size: ${cleanImage.length} bytes`)
    console.log(`   Bytes removed: ${testImage.length - cleanImage.length} bytes`)
  } catch (error) {
    console.error('   ✗ FAILED:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  // Check metadata AFTER stripping
  const metadataAfter = await sharp(cleanImage).metadata()
  console.log('\n4. Metadata AFTER stripping:')
  console.log(`   Has EXIF: ${metadataAfter.exif !== undefined}`)
  console.log(`   Has IPTC: ${metadataAfter.iptc !== undefined}`)
  console.log(`   Has XMP: ${metadataAfter.xmp !== undefined}`)

  // SECURITY VERIFICATION
  console.log('\n=== SECURITY VERIFICATION ===')

  const passed: string[] = []
  const failed: string[] = []

  if (metadataAfter.exif === undefined) {
    passed.push('✓ EXIF data completely removed')
  } else {
    failed.push('✗ EXIF data still present (GPS LEAK RISK)')
  }

  if (metadataAfter.iptc === undefined) {
    passed.push('✓ IPTC data completely removed')
  } else {
    failed.push('✗ IPTC data still present')
  }

  if (metadataAfter.xmp === undefined) {
    passed.push('✓ XMP data completely removed')
  } else {
    failed.push('✗ XMP data still present')
  }

  if (cleanImage.length < testImage.length) {
    passed.push(`✓ Image size reduced (${testImage.length - cleanImage.length} bytes removed)`)
  } else {
    failed.push('✗ Image size not reduced (metadata may still be present)')
  }

  // Display results
  console.log('\nPASSED CHECKS:')
  passed.forEach(msg => console.log(`  ${msg}`))

  if (failed.length > 0) {
    console.log('\nFAILED CHECKS:')
    failed.forEach(msg => console.log(`  ${msg}`))
    console.log('\n❌ SECURITY TEST FAILED - GPS DATA MAY STILL BE LEAKING')
    process.exit(1)
  } else {
    console.log('\n✅ SECURITY TEST PASSED - ALL METADATA REMOVED')
    console.log('✅ GPS Data Leakage Vulnerability FIXED (CVSS 6.5)')
  }

  // Test error handling (fail closed)
  console.log('\n5. Testing error handling (fail closed)...')
  const invalidBuffer = Buffer.from('invalid image data')
  try {
    await stripEXIFData(invalidBuffer)
    console.log('   ✗ FAILED: Should have thrown error for invalid image')
    process.exit(1)
  } catch (error) {
    console.log('   ✓ Correctly threw error for invalid image (fail closed)')
    console.log('   ✓ Security policy: Never return unprocessed images')
  }

  console.log('\n=== ALL TESTS PASSED ===')
}

testExifStripping().catch(error => {
  console.error('Test failed with error:', error)
  process.exit(1)
})
