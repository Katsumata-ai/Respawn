-- Fix user_id type to store Whop user IDs (strings) instead of UUIDs
-- This migration changes user_id from UUID to VARCHAR to match Whop user IDs

-- Step 1: Create a new column with the correct type
ALTER TABLE videos ADD COLUMN user_id_new VARCHAR(255);

-- Step 2: Copy data from old column to new column (convert UUID to string)
UPDATE videos SET user_id_new = user_id::text;

-- Step 3: Drop the old column
ALTER TABLE videos DROP COLUMN user_id;

-- Step 4: Rename the new column to user_id
ALTER TABLE videos RENAME COLUMN user_id_new TO user_id;

-- Step 5: Add NOT NULL constraint
ALTER TABLE videos ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Recreate the index on user_id
CREATE INDEX idx_videos_user_id ON videos(user_id);

-- Step 7: Do the same for video_accesses table
ALTER TABLE video_accesses ADD COLUMN user_id_new VARCHAR(255);
UPDATE video_accesses SET user_id_new = user_id::text;
ALTER TABLE video_accesses DROP COLUMN user_id;
ALTER TABLE video_accesses RENAME COLUMN user_id_new TO user_id;
ALTER TABLE video_accesses ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX idx_video_accesses_user_id ON video_accesses(user_id);

-- Step 8: Do the same for video_shares table
ALTER TABLE video_shares ADD COLUMN shared_by_user_id_new VARCHAR(255);
UPDATE video_shares SET shared_by_user_id_new = shared_by_user_id::text;
ALTER TABLE video_shares DROP COLUMN shared_by_user_id;
ALTER TABLE video_shares RENAME COLUMN shared_by_user_id_new TO shared_by_user_id;
ALTER TABLE video_shares ALTER COLUMN shared_by_user_id SET NOT NULL;

-- shared_with_user_id can be NULL, so handle it differently
ALTER TABLE video_shares ADD COLUMN shared_with_user_id_new VARCHAR(255);
UPDATE video_shares SET shared_with_user_id_new = shared_with_user_id::text;
ALTER TABLE video_shares DROP COLUMN shared_with_user_id;
ALTER TABLE video_shares RENAME COLUMN shared_with_user_id_new TO shared_with_user_id;

