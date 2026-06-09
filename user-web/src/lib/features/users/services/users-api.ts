import type { components } from '../../../types/api.generated';
import { authStore } from '../../auth/services/auth-store.svelte';
import { apiConfig } from '../../../services/api-config.svelte';

export type User = components['schemas']['User'];
export type CreateUserDto = components['schemas']['CreateUserDto'];
export type UpdateUserDto = components['schemas']['UpdateUserDto'];

function getHeaders(contentType: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`;
  }
  return headers;
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const response = await fetch(`${apiConfig.baseUrl}/users`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    throw new Error(error.message || 'Error de conexión con el backend');
  }
}

export async function createUser(name: string, email: string, role: string, password?: string): Promise<User> {
  const payload: any = { name, email, role };
  if (password) {
    payload.password = password;
  }
  try {
    const response = await fetch(`${apiConfig.baseUrl}/users`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    throw new Error(error.message || 'Error de conexión al crear usuario');
  }
}

export async function updateUser(id: number, name: string, email: string, role: string, password?: string): Promise<User> {
  const payload: UpdateUserDto & { password?: string } = { name, email, role: role as any };
  if (password) {
    payload.password = password;
  }
  try {
    const response = await fetch(`${apiConfig.baseUrl}/users/${id}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error(`Error al actualizar usuario ${id}:`, error);
    throw new Error(error.message || 'Error de conexión al actualizar usuario');
  }
}

export async function deleteUser(id: number): Promise<User> {
  try {
    const response = await fetch(`${apiConfig.baseUrl}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error(`Error al eliminar usuario ${id}:`, error);
    throw new Error(error.message || 'Error de conexión al eliminar usuario');
  }
}
