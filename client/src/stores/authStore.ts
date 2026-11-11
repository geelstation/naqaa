import { create } from 'zustand';
import type { PublicUser } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: PublicUser | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithUsername: (username: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateProfile: (data: { username?: string; avatar?: string; bio?: string }) => Promise<{ user: PublicUser }>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('naqaa_token'),
  loading: false,
  initialized: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { token, user } = await api.login(email, password);
      localStorage.setItem('naqaa_token', token);
      set({ user, token, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  loginWithUsername: async (username) => {
    set({ loading: true });
    try {
      const { token, user } = await api.loginWithUsername(username);
      localStorage.setItem('naqaa_token', token);
      set({ user, token, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  register: async (username, email, password) => {
    set({ loading: true });
    try {
      const { token, user } = await api.register(username, email, password);
      localStorage.setItem('naqaa_token', token);
      set({ user, token, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('naqaa_token');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    try {
      const { user } = await api.getMe();
      set({ user });
    } catch {
      localStorage.removeItem('naqaa_token');
      set({ user: null, token: null });
    }
  },

  updateProfile: async (data) => {
    const { user } = await api.updateProfile(data);
    set({ user });
    return { user };
  },

  init: async () => {
    const token = get().token;
    if (token) {
      await get().fetchMe();
    }
    set({ initialized: true });
  },
}));
