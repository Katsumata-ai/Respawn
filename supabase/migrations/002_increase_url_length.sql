-- Increase URL column sizes to support long Mux URLs with tokens
ALTER TABLE videos
  ALTER COLUMN s3_url TYPE VARCHAR(2000),
  ALTER COLUMN mux_url TYPE VARCHAR(2000),
  ALTER COLUMN thumbnail TYPE VARCHAR(2000);

