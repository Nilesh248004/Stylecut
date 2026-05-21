ALTER TABLE client_users
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN password_hash DROP NOT NULL,
  ALTER COLUMN password_salt DROP NOT NULL;

ALTER TABLE client_users
  ADD COLUMN IF NOT EXISTS google_sub VARCHAR(160),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS client_users_google_sub_key
  ON client_users (google_sub)
  WHERE google_sub IS NOT NULL;
