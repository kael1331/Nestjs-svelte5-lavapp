<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/features/auth/services/auth-store.svelte';
  import PageFrame from '$lib/components/layout/PageFrame.svelte';

  let { children } = $props();

  $effect(() => {
    if (authStore.loading) return;

    const user = authStore.user;
    const path = $page.url.pathname;

    if (!user) {
      goto('/login');
      return;
    }

    if (path.startsWith('/dashboard/super-admin') && user.role !== 'super_admin') {
      redirectToCorrectDashboard(user.role);
    } else if (path.startsWith('/dashboard/admin') && user.role !== 'admin') {
      redirectToCorrectDashboard(user.role);
    } else if (path.startsWith('/dashboard/client') && user.role !== 'client') {
      redirectToCorrectDashboard(user.role);
    }
  });

  function redirectToCorrectDashboard(role: string) {
    if (role === 'super_admin') {
      goto('/dashboard/super-admin');
    } else if (role === 'admin') {
      goto('/dashboard/admin');
    } else {
      goto('/dashboard/client');
    }
  }
</script>

<svelte:head>
  <!-- Google Fonts para Tipografía Premium -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
</svelte:head>

{#if authStore.loading}
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; font-family: sans-serif; color: white;">
    <h3>Verificando sesión...</h3>
  </div>
{:else if authStore.user}
  <PageFrame>
    {@render children()}
  </PageFrame>
{/if}

