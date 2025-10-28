/**
 * Test script for video downloader
 * Run with: npx ts-node lib/download/test.ts
 */

import { DownloadService } from './service';

async function testDownload() {
  console.log('🎬 Starting Whop Video Downloader Test\n');

  // Test Mux URL (from the user)
  const testMuxUrl =
    'https://stream.mux.com/OABpWBZb02bRRHONNxYM3xPM6802zggikEIMPtsJFLc1s.m3u8?token=eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJPQUJwV0JaYjAyYlJSSE9OTnhZTTN4UE02ODAyemdnaWtFSU1QdHNKRkxjMXMiLCJleHAiOjE3NjM4NTYwMDAsImtpZCI6IjJIeEtWQlZSWGRDMDFpNDZ4MDBNR09KMngxaXM4QjAyUlpDRFlCd2taOGp4TUEiLCJhdWQiOiJ2In0.VpZgZBNHpBdozb5oGP65VC5SUacUBwQnhS34YaJz3qPHrWJKp3UxdQ7pz-pn89Fg4T27zplYbBiQ--FGNXcjLhUiXm_SPZQkTsSK0SQhs-Jb2iCMWW8GNOgpEqvxQVu3j_nSyTtLJeGELKcY6s_rEbS0mXn6BtxtulmKmi5My4cphh4RiZjgfzZ7bslV9Y8pzJ9_CUk_drQpHaOuUYPXYYSNrNOb4u2CBTGamiFeQNNfpDcZoLC3o2OtW3Soklq5QrKU9Z6XR6wN0ejcQ_ckBjGIAUab976Soihs1QnxrHrU1fuQCLHpwimjvGHojzg-e9U0ZNUqk0NVEWd2DlFRtQ';

  const service = new DownloadService();

  try {
    console.log('📥 Processing download request...\n');

    const result = await service.processDownload({
      muxUrl: testMuxUrl,
      videoTitle: 'Test Whop Video',
      userId: 'test-user-123',
    });

    console.log('\n✅ Download Result:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n🎉 Success! Video downloaded and processed.');
      console.log(`📺 View URL: ${result.viewUrl}`);
      console.log(`⬇️ Download URL: ${result.downloadUrl}`);
    } else {
      console.log('\n❌ Download failed:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testDownload().catch(console.error);

