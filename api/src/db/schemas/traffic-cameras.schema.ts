// Generated code for: Create Drizzle ORM schema for traffic cameras:
- Table: traffic_cameras
- Fields: id (uuid), fl511_id (string), name (text), route (text), latitude (decimal), longitude (decimal), image_url (text), status (enum), last_updated (timestamp)
- Indexes: on lat/lng for geospatial queries, on route
- Relations: none needed
Use Drizzle pgTable, add proper constraints.
// TODO: Implement using OpenAI Codex
