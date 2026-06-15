export interface MenuItem {
  id: string;
  label: string;
  roles: ('client' | 'admin' | 'super_admin')[];
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'home', label: 'Home', roles: ['client', 'admin', 'super_admin'] },
  { id: 'users', label: 'Gestión de Usuarios', roles: ['super_admin'] },
  { id: 'subscriptions', label: 'Validar Suscripciones', roles: ['super_admin'] },
  { id: 'config', label: 'Configuración', roles: ['super_admin'] },
  { id: 'operations', label: 'Operations', roles: ['admin'] },
  { id: 'vehicles', label: 'Vehículo', roles: ['admin'] },
  { id: 'services', label: 'Servicio', roles: ['admin'] },
  { id: 'membership', label: 'Membresía', roles: ['admin'] },
  { id: 'wash-settings', label: 'Configuración', roles: ['admin'] },
  { id: 'orders', label: 'Mis Pedidos', roles: ['client'] },
];

import { authStore } from '$lib/features/auth/services/auth-store.svelte';

class NavStore {
  #activeTab = $state<string>('home');
  isSidebarOpen = $state<boolean>(false);

  get activeTab(): string {
    const role = authStore.user?.role;
    if (role) {
      const allowed = MENU_ITEMS.find(item => item.id === this.#activeTab && item.roles.includes(role));
      if (!allowed) {
        const authorized = this.getAuthorizedItems(role);
        if (authorized.length > 0) {
          this.#activeTab = authorized[0].id;
        } else {
          this.#activeTab = 'home';
        }
      }
    }
    return this.#activeTab;
  }

  set activeTab(value: string) {
    const role = authStore.user?.role;
    if (!role) {
      this.#activeTab = value;
      return;
    }
    const item = MENU_ITEMS.find(i => i.id === value);
    if (item && item.roles.includes(role)) {
      this.#activeTab = value;
    } else {
      console.warn(`Tentativa de acceso no autorizado a pestaña: ${value} para el rol ${role}`);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  reset(defaultTab = 'home') {
    const role = authStore.user?.role;
    if (role) {
      const item = MENU_ITEMS.find(i => i.id === defaultTab);
      if (item && item.roles.includes(role)) {
        this.#activeTab = defaultTab;
      } else {
        const authorized = this.getAuthorizedItems(role);
        this.#activeTab = authorized.length > 0 ? authorized[0].id : 'home';
      }
    } else {
      this.#activeTab = defaultTab;
    }
    this.isSidebarOpen = false;
  }

  getAuthorizedItems(role: string): MenuItem[] {
    return MENU_ITEMS.filter(item => item.roles.includes(role as any));
  }
}

export const navStore = new NavStore();
