/**
 * Swasthya Setu - Authentication Service
 * Handles user authentication (register, login, logout)
 */

import { get, post } from './api';

/**
 * Register a new user
 * @param {object} userData - User registration data
 * @returns {Promise} - User data
 */
export async function register(userData) {
    return post('/auth/register/', userData);
}

/**
 * Login user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise} - User data
 */
export async function login(username, password) {
    return post('/auth/login/', { username, password });
}

/**
 * Logout current user
 * @returns {Promise}
 */
export async function logout() {
    return post('/auth/logout/', {});
}

/**
 * Get current logged-in user
 * @returns {Promise} - User data
 */
export async function getCurrentUser() {
    return get('/auth/me/');
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
    try {
        await getCurrentUser();
        return true;
    } catch (error) {
        return false;
    }
}

export default {
    register,
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
};
