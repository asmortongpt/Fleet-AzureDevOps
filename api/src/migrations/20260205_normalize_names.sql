-- Normalize whitespace in names across identity tables.
-- Prevents UI oddities like "CTA  6" caused by older seed padding.

UPDATE users
SET
  first_name = regexp_replace(trim(first_name), '\s+', ' ', 'g'),
  last_name  = regexp_replace(trim(last_name),  '\s+', ' ', 'g')
WHERE (first_name ~ '\s{2,}') OR (last_name ~ '\s{2,}') OR (first_name <> trim(first_name)) OR (last_name <> trim(last_name));

UPDATE drivers
SET
  first_name = regexp_replace(trim(first_name), '\s+', ' ', 'g'),
  last_name  = regexp_replace(trim(last_name),  '\s+', ' ', 'g')
WHERE (first_name ~ '\s{2,}') OR (last_name ~ '\s{2,}') OR (first_name <> trim(first_name)) OR (last_name <> trim(last_name));

