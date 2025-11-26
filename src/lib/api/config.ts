import { OpenAPI } from './generated/core/OpenAPI';

// Override the BASE URL for server-side requests
// The generated code only has a relative path, but server-side fetch requires a full URL
OpenAPI.BASE = (process.env.API_BASE_URL || 'http://localhost:3000') + '/api/external/website';

