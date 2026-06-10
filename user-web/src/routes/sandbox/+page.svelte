<script lang="ts">
  import TestUserList from '$lib/components/test/TestUserList.svelte';
  import TestUserCrud from '$lib/components/test/TestUserCrud.svelte';
  import { authStore } from '$lib/features/auth/services/auth-store.svelte';

  // Usando Svelte 5 Runes para reactividad local
  let showComponent = $state(false);
  let showCrud = $state(false);

  function toggleList() {
    showComponent = !showComponent;
    if (showComponent) showCrud = false;
  }

  function toggleCrud() {
    showCrud = !showCrud;
    if (showCrud) showComponent = false;
  }
</script>

<svelte:head>
  <title>Frontend Sandbox - Pruebas</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<main class="sandbox-container">
  <div class="glass-hero">
    <!-- SESION DE USUARIO (FUNCIONAL) -->
    <div style="background: rgba(255, 255, 255, 0.05); padding: 12px; margin-bottom: 20px; border-radius: 12px; border: 1px dashed rgba(255, 255, 255, 0.2); font-size: 0.9rem; text-align: left; display: flex; justify-content: space-between; align-items: center; color: white;">
      {#if authStore.loading}
        <span>Cargando estado de sesión...</span>
      {:else if authStore.user}
        <div>
          <span>Sesión activa: <strong>{authStore.user.name}</strong> ({authStore.user.role})</span>
          <a href="/dashboard/{authStore.user.role.replace('_', '-')}" style="margin-left: 15px; color: #a78bfa; text-decoration: underline;">Ir a mi Dashboard</a>
        </div>
        <button onclick={() => authStore.logout()} style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Log Out</button>
      {:else}
        <span>No has iniciado sesión</span>
        <a href="/login" style="padding: 6px 12px; background: #a78bfa; color: black; border-radius: 6px; text-decoration: none; font-weight: bold;">Iniciar Sesión / Registro</a>
      {/if}
    </div>

    <div class="logo">
      <span class="pulse"></span>
      <h1>Frontend Sandbox</h1>
    </div>
    <p class="subtitle">Entorno de pruebas y arquitectura de componentes en Svelte 5</p>

    <div class="button-grid">
      <!-- Botón 1: Navegación real multipágina de SvelteKit -->
      <a href="/test-page" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h6v6"/><path d="M24 8 16 16l-4-4-8 8"/></svg>
        Navegar a Página 2
      </a>

      <!-- Botón 2: Renderizado Dinámico de Componente Listado -->
      <button onclick={toggleList} class="btn btn-secondary {showComponent ? 'active' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h5a3 3 0 0 1 0 6H9"/></svg>
        {showComponent ? 'Ocultar Lista' : 'Visualizar Lista'}
      </button>

      <!-- Botón 3: Renderizado Dinámico de CRUD Completo -->
      <button onclick={toggleCrud} class="btn btn-tertiary {showCrud ? 'active' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        {showCrud ? 'Ocultar CRUD' : 'Visualizar CRUD'}
      </button>
    </div>
  </div>

  {#if showComponent}
    <div class="component-wrapper">
      <TestUserList />
    </div>
  {/if}

  {#if showCrud}
    <div class="component-wrapper">
      <TestUserCrud />
    </div>
  {/if}
</main>

<style>
  :global(body) {
    background: radial-gradient(circle at top, #1e1b4b 0%, #09090b 100%);
    color: #f4f4f5;
    font-family: 'Outfit', sans-serif;
    margin: 0;
    padding: 0;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .sandbox-container {
    width: 100%;
    max-width: 900px;
    margin: 60px auto 40px auto;
    padding: 0 20px;
    box-sizing: border-box;
  }

  .glass-hero {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 32px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }

  .logo {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .pulse {
    width: 10px;
    height: 10px;
    background-color: #a78bfa;
    border-radius: 50%;
    box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.7);
    animation: pulse 1.8s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.7);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 10px rgba(167, 139, 250, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(167, 139, 250, 0);
    }
  }

  .logo h1 {
    font-size: 2.2rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #ffffff 0%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.02em;
  }

  .subtitle {
    color: #a1a1aa;
    font-size: 1.1rem;
    margin-top: 0;
    margin-bottom: 28px;
    font-weight: 300;
  }

  .button-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  @media (max-width: 768px) {
    .button-grid {
      grid-template-columns: 1fr;
    }
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .btn-primary {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: #ffffff;
    border: none;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  }

  .btn-secondary, .btn-tertiary {
    background: rgba(255, 255, 255, 0.04);
    color: #e4e4e7;
  }

  .btn-secondary:hover, .btn-tertiary:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }

  .btn-secondary.active, .btn-tertiary.active {
    background: rgba(167, 139, 250, 0.12);
    border-color: rgba(167, 139, 250, 0.35);
    color: #c084fc;
  }

  .component-wrapper {
    margin-top: 24px;
  }
</style>
