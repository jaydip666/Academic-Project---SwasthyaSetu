// ================= FRONTEND FILE =================
// File: api.js
// Purpose: Main API service client for frontend-backend communication
// Handles: Fetch requests (GET, POST, PUT, DELETE), media URL generation, and error handling
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:8000/api`;
const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:8000`;

const getErrorMessage = (result, response, prefix) => {
    return result.error || result.detail || (Object.keys(result).length > 0 ? JSON.stringify(result) : null) || `${prefix}: ${response.status}`;
};

export const api = {
    get: async (endpoint, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Token ${token}` } : {}),
                },
                credentials: 'include',
            });

            const text = await response.text();
            let result = {};
            try {
                result = JSON.parse(text);
            } catch (error) {
                result = { error: text };
            }

            if (!response.ok) {
                const error = new Error(getErrorMessage(result, response, 'API Error'));
                error.data = result;
                error.status = response.status;
                throw error;
            }

            return result;
        } catch (error) {
            console.error('API Get Error:', error);
            throw error;
        }
    },

    post: async (endpoint, data, optionsOrToken) => {
        const isFormData = data instanceof FormData;
        const token = typeof optionsOrToken === 'string' ? optionsOrToken : optionsOrToken?.token;
        const headers = {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { Authorization: `Token ${token}` } : {}),
            ...(typeof optionsOrToken === 'object' ? optionsOrToken.headers : {}),
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: headers,
                body: isFormData ? data : JSON.stringify(data),
                credentials: 'include',
            });

            let result = {};
            try {
                result = await response.json();
            } catch { }

            if (!response.ok) {
                const error = new Error(getErrorMessage(result, response, 'API Error'));
                error.data = result;
                error.status = response.status;
                throw error;
            }

            return result;
        } catch (error) {
            console.error('API Post Error:', error);
            throw error;
        }
    },

    put: async (endpoint, data, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Token ${token}` } : {}),
                },
                body: JSON.stringify(data),
                credentials: 'include',
            });

            let result = {};
            try {
                result = await response.json();
            } catch { }

            if (!response.ok) {
                throw new Error(getErrorMessage(result, response, 'API Error'));
            }

            return result;
        } catch (error) {
            console.error('API Put Error:', error);
            throw error;
        }
    },

    delete: async (endpoint, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Token ${token}` } : {}),
                },
                credentials: 'include',
            });

            let result = {};
            try {
                result = await response.json();
            } catch { }

            if (!response.ok) {
                throw new Error(getErrorMessage(result, response, 'API Error'));
            }

            return result;
        } catch (error) {
            console.error('API Delete Error:', error);
            throw error;
        }
    },

    uploadFile: async (endpoint, formData, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Token ${token}` } : {}),
                },
                body: formData,
                credentials: 'include',
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }
            return result;
        } catch (error) {
            console.error('API Upload Error:', error);
            throw error;
        }
    },

    getMediaUrl: (path) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('blob:')) return path;
        
        // Ensure path starts with a slash
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        
        // If it doesn't already start with /media/, prepend it
        if (!normalizedPath.startsWith('/media/')) {
            return `${BACKEND_URL}/media${normalizedPath}`;
        }
        
        return `${BACKEND_URL}${normalizedPath}`;
    },

    getFile: async (endpoint, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    ...(token ? { Authorization: `Token ${token}` } : {}),
                },
                credentials: 'include',
            });

            if (!response.ok) {
                let result = {};
                try {
                    result = await response.json();
                } catch (error) { }
                const error = new Error(getErrorMessage(result, response, 'File Download Error'));
                error.data = result;
                error.status = response.status;
                throw error;
            }

            return await response.blob();
        } catch (error) {
            console.error('API GetFile Error:', error);
            throw error;
        }
    }
};
