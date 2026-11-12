-- Assignment saving is now the sole case writer. Keep existing case data and
-- public projections; remove the obsolete independently callable publisher.
drop function if exists public.save_practice_tests(uuid, integer, text, jsonb);