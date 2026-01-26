-- api/migrations/020_websocket_events.sql

-- This migration creates two tables: websocket_events and task_presence
-- websocket_events stores logs of all events sent over WebSocket connections for audit purposes
-- task_presence tracks which users are viewing which tasks in real-time

BEGIN;

-- Create websocket_events table
CREATE TABLE IF NOT EXISTS websocket_events (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    event_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add an index on tenant_id and created_at for faster query performance
CREATE INDEX IF NOT EXISTS idx_websocket_events_tenant_id_created_at ON websocket_events (tenant_id, created_at);

-- Create task_presence table
CREATE TABLE IF NOT EXISTS task_presence (
    id SERIAL PRIMARY KEY,
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes to improve lookup times for task_presence
CREATE INDEX IF NOT EXISTS idx_task_presence_task_id ON task_presence (task_id);
CREATE INDEX IF NOT EXISTS idx_task_presence_user_id ON task_presence (user_id);
CREATE INDEX IF NOT EXISTS idx_task_presence_tenant_id ON task_presence (tenant_id);

-- Ensure data integrity with foreign keys if users and tasks tables exist
-- Adjust the following statements according to your actual users and tasks table structure
-- ALTER TABLE websocket_events ADD CONSTRAINT fk_websocket_events_user_id FOREIGN KEY (user_id) REFERENCES users(id);
-- ALTER TABLE websocket_events ADD CONSTRAINT fk_websocket_events_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);
-- ALTER TABLE task_presence ADD CONSTRAINT fk_task_presence_task_id FOREIGN KEY (task_id) REFERENCES tasks(id);
-- ALTER TABLE task_presence ADD CONSTRAINT fk_task_presence_user_id FOREIGN KEY (user_id) REFERENCES users(id);
-- ALTER TABLE task_presence ADD CONSTRAINT fk_task_presence_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

COMMIT;