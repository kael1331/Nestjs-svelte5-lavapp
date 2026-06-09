<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchUsers, createUser, type User } from '../../features/users/services/users-api';

  // Estados reactivos usando Runes de Svelte 5
  let users = $state<User[]>([]);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  // Campos del formulario
  let newName = $state('');
  let newEmail = $state('');
  let submitting = $state(false);

  // Carga inicial al montar el componente
  onMount(async () => {
    await loadUsers();
  });

  async function loadUsers() {
    loading = true;
    errorMsg = null;
    try {
      users = await fetchUsers();
    } catch (err: any) {
      errorMsg = err.message || 'No se pudo conectar con la API de NestJS';
    } finally {
      loading = false;
    }
  }

  // Enviar formulario para crear un usuario real en el backend
  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    submitting = true;
    try {
      const created = await createUser(newName, newEmail, 'client');
      // Actualizamos el estado local agregando el nuevo usuario real
      users = [...users, created];
      // Limpiamos los campos
      newName = '';
      newEmail = '';
    } catch (err: any) {
      alert(`Error al crear usuario: ${err.message}`);
    } finally {
      submitting = false;
    }
  }

  // Asignar roles virtuales en el frontend por ahora para demostración visual de diseño
  function getVirtualRole(id: number): string {
    if (id === 1) return 'super_admin';
    if (id === 2) return 'admin';
    return 'client';
  }

  function getRoleColor(role: string) {
    switch (role) {
      case 'super_admin': return 'role-super';
      case 'admin': return 'role-admin';
      default: return 'role-client';
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrador';
      default: return 'Cliente';
    }
  }
</script>

<div class="user-list-card">
  <div class="card-header">
    <h3>Consola de Pruebas de API Real</h3>
    <button onclick={loadUsers} class="btn-refresh" disabled={loading}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
      Actualizar
    </button>
  </div>

  <!-- Formulario interactivo para crear usuarios en el backend -->
  <form onsubmit={handleSubmit} class="user-form">
    <h4>Agregar Usuario Real a la API</h4>
    <div class="form-row">
      <input 
        type="text" 
        placeholder="Nombre Completo" 
        bind:value={newName} 
        required 
        disabled={submitting}
      />
      <input 
        type="email" 
        placeholder="correo@ejemplo.com" 
        bind:value={newEmail} 
        required 
        disabled={submitting}
      />
      <button type="submit" class="btn-submit" disabled={submitting}>
        {submitting ? 'Creando...' : 'Crear Usuario'}
      </button>
    </div>
  </form>

  <div class="table-container">
    {#if loading}
      <div class="status-msg">
        <span class="spinner"></span>
        Cargando usuarios desde NestJS (puerto 3000)...
      </div>
    {:else if errorMsg}
      <div class="status-msg error-msg">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        <span>{errorMsg}</span>
        <button onclick={loadUsers} class="btn-retry">Reintentar</button>
      </div>
    {:else if users.length === 0}
      <div class="status-msg empty-msg">
        La API de NestJS no tiene usuarios registrados actualmente. ¡Agrega uno arriba!
      </div>
    {:else}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol (Virtual)</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user (user.id)}
            <tr class="user-row">
              <td class="user-id">#{user.id}</td>
              <td class="user-name">{user.name}</td>
              <td class="user-email">{user.email}</td>
              <td>
                <span class="role-badge {getRoleColor(getVirtualRole(user.id))}">
                  {getRoleLabel(getVirtualRole(user.id))}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .user-list-card {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    color: #f3f4f6;
    margin-top: 20px;
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 12px;
  }

  .card-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    background: linear-gradient(135deg, #a78bfa, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .btn-refresh {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f3f4f6;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-refresh:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
  }

  /* Formulario */
  .user-form {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
  }

  .user-form h4 {
    margin: 0 0 12px 0;
    font-size: 0.95rem;
    color: #c084fc;
    font-weight: 500;
  }

  .form-row {
    display: grid;
    grid-template-columns: 2fr 2fr 1fr;
    gap: 12px;
  }

  @media (max-width: 600px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }

  .user-form input {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px 14px;
    color: #ffffff;
    font-size: 0.9rem;
    transition: border-color 0.2s;
  }

  .user-form input:focus {
    outline: none;
    border-color: #a78bfa;
  }

  .btn-submit {
    background: #7c3aed;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-submit:hover:not(:disabled) {
    background: #8b5cf6;
  }

  .table-container {
    overflow-x: auto;
    min-height: 120px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  th {
    padding: 12px 16px;
    font-size: 0.85rem;
    text-transform: uppercase;
    color: #9ca3af;
    font-weight: 600;
    letter-spacing: 0.05em;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  td {
    padding: 16px;
    font-size: 0.95rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .user-row {
    transition: background-color 0.2s ease;
  }

  .user-row:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .user-id {
    font-family: monospace;
    color: #9ca3af;
  }

  .user-name {
    font-weight: 500;
    color: #ffffff;
  }

  .user-email {
    color: #d1d5db;
  }

  .role-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-align: center;
  }

  .role-super {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  .role-admin {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #fbbf24;
  }

  .role-client {
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #60a5fa;
  }

  /* Estados de Carga, Error y Vacío */
  .status-msg {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    color: #a1a1aa;
    text-align: center;
    font-size: 0.95rem;
  }

  .error-msg {
    color: #f87171;
  }

  .btn-retry {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #f87171;
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    margin-top: 8px;
  }

  .btn-retry:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(167, 139, 250, 0.1);
    border-top-color: #a78bfa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
