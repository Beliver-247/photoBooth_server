/**
 * Test script to verify backend setup and Cloudinary integration
 * 
 * Usage: node test-backend.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testBackend() {
  console.log('🧪 Testing PhotoBooth Backend...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣  Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log();

    // Test 2: Create session
    console.log('2️⃣  Creating a test session...');
    const sessionResponse = await axios.post(`${BASE_URL}/api/sessions`, {
      eventId: 'test-event-123'
    });
    const sessionId = sessionResponse.data.sessionId;
    console.log('✅ Session created:', sessionId);
    console.log();

    // Test 3: Get upload signature
    console.log('3️⃣  Getting Cloudinary upload signature...');
    const signatureResponse = await axios.get(
      `${BASE_URL}/api/sessions/${sessionId}/upload-signature`
    );
    console.log('✅ Upload signature received');
    console.log('   Cloud Name:', signatureResponse.data.cloudName);
    console.log('   Folder:', signatureResponse.data.folder);
    console.log();

    // Test 4: Store dummy photo IDs
    console.log('4️⃣  Storing dummy photo IDs...');
    const photoIds = [
      'photobooth/test_photo_1',
      'photobooth/test_photo_2',
      'photobooth/test_photo_3'
    ];
    await axios.post(`${BASE_URL}/api/sessions/${sessionId}/photos`, {
      photoPublicIds: photoIds
    });
    console.log('✅ Photo IDs stored');
    console.log();

    console.log('🎉 All basic tests passed!');
    console.log();
    console.log('⚠️  Note: To fully test the system, you need to:');
    console.log('   1. Upload real photos to Cloudinary');
    console.log('   2. Call /api/sessions/:sessionId/complete');
    console.log('   3. Visit the generated /r/:slug URL');
    console.log('   4. Test email/SMS sharing with valid credentials');
    console.log();
    console.log('📱 Now test the mobile app to complete the full flow!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

testBackend();
