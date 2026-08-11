import { create } from 'zustand';

export interface AuthUser {
  name: string;
  login: string;
  role: string;
  avatarUrl: string;
}

interface AuthState {
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  login: (username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Restore session from localStorage if available
  const savedUser = localStorage.getItem('serrano_auth_user');
  const isAuthenticated = !!savedUser;
  let currentUser: AuthUser | null = null;
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch {
      // ignore
    }
  }

  return {
    isAuthenticated,
    currentUser,
    login: (username) => {
      const cleanUsername = username.trim();
      const loginKey = cleanUsername.toLowerCase().replace(/\s+/g, '.');

      let name = cleanUsername;
      let login = loginKey;
      let role = 'Operador de Processos';
      let avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(loginKey)}`;

      // Match default seeded users for rich experience
      if (loginKey === 'bruno.kappi' || loginKey === 'bruno') {
        name = 'Bruno Kappi';
        login = 'bruno.kappi';
        role = 'Engenheiro de Automação';
        avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=bruno';
      } else if (loginKey === 'carlos.souza' || loginKey === 'carlos') {
        name = 'Carlos Souza';
        login = 'carlos.souza';
        role = 'Operador de Painel';
        avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=carlos';
      } else if (loginKey === 'ana.martins' || loginKey === 'ana') {
        name = 'Ana Martins';
        login = 'ana.martins';
        role = 'Supervisor de Planta';
        avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=ana';
      }

      const user: AuthUser = { name, login, role, avatarUrl };
      localStorage.setItem('serrano_auth_user', JSON.stringify(user));
      set({ isAuthenticated: true, currentUser: user });
    },
    logout: () => {
      localStorage.removeItem('serrano_auth_user');
      set({ isAuthenticated: false, currentUser: null });
    },
  };
});
