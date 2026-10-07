CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE OR REPLACE FUNCTION public.uuid_generate_v4() RETURNS uuid AS $$ SELECT extensions.uuid_generate_v4() $$ LANGUAGE SQL VOLATILE;
