/**
 * API client for JurisAide Calculation API
 *
 * Handles all HTTP requests to the backend calculation endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface RequestOptions {
  headers?: Record<string, string>;
  body?: string;
}

/**
 * Make an authenticated API request
 */
async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: unknown,
  authKey?: string
): Promise<unknown> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options: RequestOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add auth if provided
  if (authKey) {
    const encoded = btoa(`${authKey}:${authKey}`);
    options.headers!['Authorization'] = `Basic ${encoded}`;
  }

  // Add body for non-GET requests
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, {
    method,
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  // Return null for 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Calculations API
 */
export const calculationApi = {
  /**
   * Create a new calculation
   */
  async create(data: unknown, authKey: string) {
    return apiRequest('/calculations/', 'POST', data, authKey);
  },

  /**
   * List all calculations with optional pagination and search
   */
  async list(authKey: string, params?: { q?: string; cursor?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.cursor) searchParams.append('cursor', params.cursor);

    const query = searchParams.toString();
    const endpoint = `/calculations/${query ? '?' + query : ''}`;
    
    return apiRequest(endpoint, 'GET', undefined, authKey);
  },

  /**
   * Get a specific calculation by ID
   */
  async get(id: string, authKey: string) {
    return apiRequest(`/calculations/${id}/`, 'GET', undefined, authKey);
  },

  /**
   * Update a calculation
   */
  async update(id: string, data: unknown, authKey: string) {
    return apiRequest(`/calculations/${id}/`, 'PUT', data, authKey);
  },

  /**
   * Delete a calculation
   */
  async delete(id: string, authKey: string) {
    return apiRequest(`/calculations/${id}/`, 'DELETE', undefined, authKey);
  },
};

export default apiRequest;
