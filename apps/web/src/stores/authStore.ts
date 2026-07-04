import { create } from "zustand";
import { apiClient } from "@/lib/axios";

interface User{
    id:         string;
    email:      string;
    name:       string;
    avatar_url?:string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    setToken: (token: string) => void;
    login: (data: { email: string; password: string }) => Promise<void>;
    register: (data: { email: string; password: string; name: string }) => Promise<void>;
    checkAuth: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set)=> ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    setToken: (token: string) => {
        localStorage.setItem('accessToken', token);
    },

    login: async (data) => {
        set({ error: null });
        try {
            const response = await apiClient.post('/auth/login', data);
            const { accessToken } = response.data;
            localStorage.setItem('accessToken', accessToken);
            // Fetch user info after login
            const userResponse = await apiClient.get('/auth/me');
            set({
                user: userResponse.data.user,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Login failed. Please try again.';
            set({ error: message, isAuthenticated: false, user: null });
            throw error;
        }
    },

    register: async (data) => {
        set({ error: null });
        try {
            await apiClient.post('/auth/register', data);
            // After registration, log the user in
            const loginResponse = await apiClient.post('/auth/login', {
                email: data.email,
                password: data.password,
            });
            const { accessToken } = loginResponse.data;
            localStorage.setItem('accessToken', accessToken);
            const userResponse = await apiClient.get('/auth/me');
            set({
                user: userResponse.data.user,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Registration failed. Please try again.';
            set({ error: message, isAuthenticated: false, user: null });
            throw error;
        }
    },

    checkAuth : async () => {
        try{
            set({isLoading: true});
            const {data} = await apiClient.get('/auth/me');
            set({
                user: data.user, 
                isAuthenticated:true, 
                isLoading:false
            });
        }catch(error){
            localStorage.removeItem('accessToken');
            set({
                user:null, 
                isAuthenticated:false, 
                isLoading:false
            });
        }
    },

    logout: async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch {
            // Even if logout endpoint fails, clear local state
        } finally {
            localStorage.removeItem('accessToken');
            set({
                user: null,
                isAuthenticated: false,
                error: null,
            });
        }
    }
}));