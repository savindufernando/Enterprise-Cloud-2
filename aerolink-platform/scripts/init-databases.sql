-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role and permissions are handled by postgres docker env vars automatically.
-- Alembic will handle all the table schemas.
SELECT 'Database Initialization Complete';
