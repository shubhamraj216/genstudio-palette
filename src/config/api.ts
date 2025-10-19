// API Configuration
// Base URL is configurable via environment variable VITE_API_BASE_URL
// Default fallback is the production Railway URL

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://python-genai-production.up.railway.app";

// Auth Endpoints
export const AUTH_ENDPOINTS = {
  ME: `${API_BASE_URL}/api/auth/me`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  GUEST: `${API_BASE_URL}/api/auth/guest`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
} as const;

// Asset Endpoints
export const ASSET_ENDPOINTS = {
  LIST: `${API_BASE_URL}/api/assets`,
  CREATE: `${API_BASE_URL}/api/assets`,
  TOGGLE_LIKE: (assetId: string) => `${API_BASE_URL}/api/assets/${encodeURIComponent(assetId)}/toggle-like`,
  INCREMENT_DOWNLOAD: (assetId: string) => `${API_BASE_URL}/api/assets/${encodeURIComponent(assetId)}/increment-download`,
} as const;

// Persona Endpoints
export const PERSONA_ENDPOINTS = {
  LIST: `${API_BASE_URL}/api/personas`,
  CREATE: `${API_BASE_URL}/api/personas`,
  UPDATE: (personaId: string) => `${API_BASE_URL}/api/personas/${personaId}`,
  DELETE: (personaId: string) => `${API_BASE_URL}/api/personas/${personaId}`,
  ACTIVATE: (personaId: string) => `${API_BASE_URL}/api/personas/${personaId}/activate`,
} as const;

// Avatar Endpoints
export const AVATAR_ENDPOINTS = {
  LIST: `${API_BASE_URL}/api/avatars`,
  UPLOAD: `${API_BASE_URL}/api/avatars/upload`,
  GET: (avatarId: string) => `${API_BASE_URL}/api/avatars/${encodeURIComponent(avatarId)}`,
  DELETE: (avatarId: string) => `${API_BASE_URL}/api/avatars/${encodeURIComponent(avatarId)}`,
  SET_DEFAULT: (avatarId: string) => `${API_BASE_URL}/api/avatars/${encodeURIComponent(avatarId)}/set-default`,
} as const;

// Conversation Endpoints
export const CONVERSATION_ENDPOINTS = {
  RECENT: `${API_BASE_URL}/api/recent-conversations`,
  GET: (conversationId: string) => `${API_BASE_URL}/api/conversations/${conversationId}`,
} as const;

// Generation Endpoints
export const GENERATION_ENDPOINTS = {
  GENERATE: `${API_BASE_URL}/api/generate`,
  GENERATE_UNIFIED: `${API_BASE_URL}/api/generate-unified`,
} as const;

// Export base URL for direct access if needed
export { API_BASE_URL };

