-- Normalize emails across core identity tables.
-- Emails should never contain whitespace; older/demo seeds may have introduced padding.

UPDATE users
SET email = regexp_replace(trim(email), '\s+', '', 'g')
WHERE email ~ '\s';

UPDATE drivers
SET email = regexp_replace(trim(email), '\s+', '', 'g')
WHERE email IS NOT NULL AND email ~ '\s';

