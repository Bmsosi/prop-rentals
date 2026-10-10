import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    token: null,

    // Initialize auth on app load
    initializeAuth: () => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            set({
                user: JSON.parse(userData),
                token: token,
                loading: false,
            });
        } else {
            set({ loading: false });
        }
    },

    // Login action
    login: (userData, token) => {
        console.log('🔐 Login - Storing user:', userData.user || userData);
        console.log('🔐 Login - User ID:', (userData.user || userData).id);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData.user || userData));
        set({
            user: userData.user || userData,
            token: token,
        });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
            user: null,
            token: null,
        });
    },

    setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token });
    },

    setLoading: (loading) => set({ loading }),
}));