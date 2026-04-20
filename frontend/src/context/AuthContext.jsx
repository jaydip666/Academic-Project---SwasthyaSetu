// ================= FRONTEND FILE =================
// File: AuthContext.jsx
// Purpose: Global authentication state management
// Handles: User login, logout, session persistence via localStorage, and user data updates

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('Restoring session...');
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser && storedUser !== 'undefined') {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser && parsedUser.role) {
                    console.log('Session restored for:', parsedUser.email, 'Role:', parsedUser.role);
                    setUser(parsedUser);
                } else {
                    console.warn('Stored user session is invalid (missing role):', parsedUser);
                    localStorage.removeItem('user');
                }
            } else {
                console.log('No stored session found.');
            }
        } catch (error) {
            console.error('Failed to restore user session:', error);
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// ✅ Make sure this is exported
export const useAuth = () => useContext(AuthContext);
