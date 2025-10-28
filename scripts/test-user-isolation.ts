/**
 * Test script to verify user data isolation and upload limits
 * Run with: npx ts-node scripts/test-user-isolation.ts
 */

import { getUserUploadCount, incrementUserUploadCount, resetUserUploadCount, getAllUploadData } from '../lib/whop/upload-tracker';

console.log('🧪 Testing User Data Isolation and Upload Limits\n');

// Test 1: Create multiple users and verify isolation
console.log('Test 1: User Isolation');
console.log('=====================');

const user1 = 'user_test_001';
const user2 = 'user_test_002';
const user3 = 'user_test_003';

// Reset any existing data
resetUserUploadCount(user1);
resetUserUploadCount(user2);
resetUserUploadCount(user3);

// User 1: Upload 2 videos
console.log(`\n${user1}: Uploading 2 videos...`);
incrementUserUploadCount(user1);
incrementUserUploadCount(user1);
console.log(`  Count: ${getUserUploadCount(user1)}/3`);

// User 2: Upload 1 video
console.log(`\n${user2}: Uploading 1 video...`);
incrementUserUploadCount(user2);
console.log(`  Count: ${getUserUploadCount(user2)}/3`);

// User 3: Upload 3 videos (reach limit)
console.log(`\n${user3}: Uploading 3 videos...`);
incrementUserUploadCount(user3);
incrementUserUploadCount(user3);
incrementUserUploadCount(user3);
console.log(`  Count: ${getUserUploadCount(user3)}/3`);

// Verify isolation
console.log('\n✅ Verification:');
console.log(`  ${user1}: ${getUserUploadCount(user1)} (expected: 2)`);
console.log(`  ${user2}: ${getUserUploadCount(user2)} (expected: 1)`);
console.log(`  ${user3}: ${getUserUploadCount(user3)} (expected: 3)`);

const allData = getAllUploadData();
console.log(`\n📊 All users data:`);
allData.forEach(data => {
  console.log(`  ${data.userId}: ${data.uploadCount} uploads`);
});

// Test 2: Verify limits
console.log('\n\nTest 2: Upload Limits');
console.log('====================');

const testUser = 'user_limit_test';
resetUserUploadCount(testUser);

console.log(`\nTesting free user limit (3 uploads):`);
for (let i = 1; i <= 4; i++) {
  const count = getUserUploadCount(testUser);
  if (count >= 3) {
    console.log(`  ❌ Upload ${i}: BLOCKED (limit reached at ${count}/3)`);
  } else {
    incrementUserUploadCount(testUser);
    console.log(`  ✅ Upload ${i}: OK (${getUserUploadCount(testUser)}/3)`);
  }
}

console.log('\n✅ All tests completed!');

