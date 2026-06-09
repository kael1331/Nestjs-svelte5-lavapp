import { goto } from '$app/navigation';
import { apiConfig } from '$lib/services/api-config.svelte';

export interface UserSession {
  id: number;
  email: string;
  role: 'client' | 'admin' | 'super_admin';
  name: string;
}

class AuthStore {
  user = $state<UserSession | null>(null);
  token = $state<string | null>(null);
  loading = $state<boolean>(true);

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('jwt_token');
      if (storedToken) {
        const decoded = this.decodeToken(storedToken);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          this.token = storedToken;
          this.user = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name || 'Usuario',
          };
        } else {
          localStorage.removeItem('jwt_token');
        }
      }
      this.loading = false;
    }
  }

  private decodeToken(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  async login(email: string, pass: string): Promise<boolean> {
    try {
      const res = await fetch(`${apiConfig.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      const token = data.access_token;
      const decoded = this.decodeToken(token);

      if (decoded) {
        this.token = token;
        this.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name || 'Usuario',
        };
        localStorage.setItem('jwt_token', token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error de login:', error);
      return false;
    }
  }

  async loginWithGoogle(googleToken: string): Promise<boolean> {
    try {
      const res = await fetch(`${apiConfig.baseUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      const token = data.access_token;
      const decoded = this.decodeToken(token);

      if (decoded) {
        this.token = token;
        this.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name || 'Usuario',
        };
        localStorage.setItem('jwt_token', token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error de login con Google:', error);
      return false;
    }
  }

  async register(name: string, email: string, pass: string, role: string): Promise<boolean> {
    try {
      const res = await fetch(`${apiConfig.baseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass, role }),
      });

      return res.ok;
    } catch (error) {
      console.error('Error de registro:', error);
      return false;
    }
  }

  async logout() {
    if (this.token) {
      try {
        await fetch(`${apiConfig.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      } catch (error) {
        console.error('Error al revocar token en servidor:', error);
      }
    }

    this.token = null;
    this.user = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
    }
    goto('/login');
  }
}

export const authStore = new AuthStore();
