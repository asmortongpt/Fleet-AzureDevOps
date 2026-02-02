/**
 * Constants for Fleet CTA MCP Server
 */

export const API_BASE_URL = process.env.FLEET_API_URL || 'http://localhost:3001/api';
export const API_TIMEOUT = parseInt(process.env.FLEET_API_TIMEOUT || '30000', 10);
export const SERVER_NAME = 'fleet-cta-mcp-server';
export const SERVER_VERSION = '1.0.0';

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 500;

export const TOOL_PREFIX = 'fleet_';
