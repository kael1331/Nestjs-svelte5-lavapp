<script lang="ts">
  import { onMount } from 'svelte';
  import { navStore } from '$lib/components/layout/nav-store.svelte';
  import { authStore } from '$lib/features/auth/services/auth-store.svelte';
  import { apiConfig } from '$lib/services/api-config.svelte';
  import UserCrud from '$lib/features/users/components/UserCrud.svelte';

  let pendingSubscriptions = $state<any[]>([]);
  let loadingSubscriptions = $state<boolean>(false);
  let actionInProgress = $state<string | null>(null);
  let selectedReceiptUrl = $state<string | null>(null);
  let receiptImageBlobUrl = $state<string | null>(null);
  let receiptLoading = $state<boolean>(false);

  async function fetchPendingSubscriptions() {
    try {
      loadingSubscriptions = true;
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/subscriptions/pending`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        pendingSubscriptions = await res.json();
      }
    } catch (e) {
      console.error('Error fetching subscriptions:', e);
    } finally {
      loadingSubscriptions = false;
    }
  }

  onMount(() => {
    navStore.reset('home');
    fetchPendingSubscriptions();
  });

  // Effect to load receipt blob when a URL is selected
  $effect(() => {
    if (selectedReceiptUrl) {
      receiptLoading = true;
      receiptImageBlobUrl = null;
      const filename = selectedReceiptUrl.split('/').pop();
      fetch(`${apiConfig.baseUrl}/car-washes/subscriptions/receipts/${filename}`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.blob();
      })
      .then(blob => {
        receiptImageBlobUrl = URL.createObjectURL(blob);
      })
      .catch(err => {
        console.error('Error loading receipt image:', err);
      })
      .finally(() => {
        receiptLoading = false;
      });
    } else {
      if (receiptImageBlobUrl) {
        URL.revokeObjectURL(receiptImageBlobUrl);
        receiptImageBlobUrl = null;
      }
    }
  });

  async function handleApprove(id: string) {
    if (!confirm('¿Estás seguro de aprobar esta suscripción?')) return;
    actionInProgress = id;
    try {
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/subscriptions/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        alert('Suscripción aprobada con éxito.');
        selectedReceiptUrl = null;
        await fetchPendingSubscriptions();
      } else {
        alert('Error al aprobar la suscripción.');
      }
    } catch (e) {
      alert('Error de conexión.');
    } finally {
      actionInProgress = null;
    }
  }

  async function handleReject(id: string) {
    if (!confirm('¿Estás seguro de rechazar esta suscripción?')) return;
    actionInProgress = id;
    try {
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/subscriptions/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        alert('Suscripción rechazada con éxito.');
        selectedReceiptUrl = null;
        await fetchPendingSubscriptions();
      } else {
        alert('Error al rechazar la suscripción.');
      }
    } catch (e) {
      alert('Error de conexión.');
    } finally {
      actionInProgress = null;
    }
  }
</script>

<svelte:head>
  <title>Dashboard Súper Administrador - LavaApp</title>
</svelte:head>

<div class="dashboard-card">
  <!-- Contenido de las pestañas -->
  <div class="tab-content">
    {#if navStore.activeTab === 'home'}
      <div class="content-panel">
        <h3 class="panel-subtitle">Resumen del Sistema</h3>
        <p class="role-notice">Acceso concedido a la consola de súper administración.</p>
        <p>Este es el panel principal de control técnico de LavaApp. Abre el menú lateral izquierdo (botón ☰) para navegar entre las opciones de administración y configuraciones.</p>
      </div>
    {:else if navStore.activeTab === 'users'}
      <div class="crud-wrapper">
        <UserCrud />
      </div>
    {:else if navStore.activeTab === 'subscriptions'}
      <div class="content-panel">
        <h3 class="panel-subtitle">Validar Suscripciones Pendientes</h3>
        <p class="section-desc">Revisa las transferencias bancarias de los administradores de lavaderos y aprueba o rechaza el acceso.</p>

        {#if loadingSubscriptions}
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Cargando suscripciones pendientes...</p>
          </div>
        {:else if pendingSubscriptions.length === 0}
          <div class="empty-state">
            <span class="empty-icon">🎉</span>
            <p class="empty-text">No hay suscripciones pendientes de validar por el momento.</p>
          </div>
        {:else}
          <div class="subscriptions-layout">
            <div class="subscriptions-list">
              {#each pendingSubscriptions as sub}
                <div class="subscription-item" class:active={selectedReceiptUrl === sub.receiptUrl}>
                  <div class="sub-info">
                    <span class="sub-wash-name">{sub.carWash?.name || 'Lavadero sin nombre'}</span>
                    <span class="sub-details">Monto: ${sub.amountPaid} | Creado: {new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div class="sub-actions">
                    <button class="btn-secondary" onclick={() => selectedReceiptUrl = sub.receiptUrl}>
                      Ver Comprobante
                    </button>
                    <button class="btn-success" disabled={actionInProgress !== null} onclick={() => handleApprove(sub.id)}>
                      {actionInProgress === sub.id ? 'Aprobando...' : 'Aprobar'}
                    </button>
                    <button class="btn-danger" disabled={actionInProgress !== null} onclick={() => handleReject(sub.id)}>
                      {actionInProgress === sub.id ? 'Rechazando...' : 'Rechazar'}
                    </button>
                  </div>
                </div>
              {/each}
            </div>

            <!-- Previsualización de Comprobante -->
            <div class="receipt-preview-panel">
              {#if selectedReceiptUrl}
                <h4 class="preview-title">Detalle del Comprobante</h4>
                <div class="receipt-img-container">
                  {#if receiptLoading}
                    <div class="spinner-small"></div>
                    <p>Descargando imagen segura...</p>
                  {:else if receiptImageBlobUrl}
                    <img src={receiptImageBlobUrl} alt="Comprobante de Pago" class="receipt-img" />
                  {:else}
                    <p class="error-text">No se pudo cargar la imagen.</p>
                  {/if}
                </div>
              {:else}
                <div class="preview-placeholder">
                  <span class="placeholder-icon">👁️</span>
                  <p>Selecciona una suscripción para previsualizar el comprobante de pago.</p>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {:else if navStore.activeTab === 'config'}
      <div class="content-panel">
        <h3 class="panel-subtitle">Configuración del Sistema</h3>
        <p class="placeholder-text">Ajustes técnicos, copias de seguridad de SQLite y expiración de tokens JWT en próximas fases.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .dashboard-card {
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    padding: 0;
  }

  .content-panel {
    padding: 16px 0;
    line-height: 1.6;
    color: #cbd5e1;
  }

  .panel-subtitle {
    margin: 0 0 12px 0;
    font-size: 22px;
    color: #f1f5f9;
    font-family: 'Outfit', sans-serif;
  }

  .role-notice {
    font-weight: bold;
    color: #ec4899;
    margin-bottom: 16px;
  }

  .crud-wrapper {
    background: transparent;
  }

  .placeholder-text {
    font-style: italic;
    color: #64748b;
  }

  .section-desc {
    font-size: 14px;
    color: #94a3b8;
    margin-bottom: 24px;
  }

  .loading-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 0;
    color: #94a3b8;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(59, 130, 246, 0.1);
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }

  .spinner-small {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(59, 130, 246, 0.1);
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 48px 24px;
    background: rgba(30, 41, 59, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
  }

  .empty-icon {
    font-size: 32px;
    margin-bottom: 12px;
    display: block;
  }

  .empty-text {
    color: #94a3b8;
    font-size: 14px;
    margin: 0;
  }

  .subscriptions-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    align-items: start;
  }

  .subscriptions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .subscription-item {
    background: rgba(30, 41, 59, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s ease;
  }

  .subscription-item:hover, .subscription-item.active {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(30, 41, 59, 0.55);
  }

  .sub-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sub-wash-name {
    font-size: 15px;
    font-weight: 700;
    color: #f1f5f9;
  }

  .sub-details {
    font-size: 12px;
    color: #94a3b8;
  }

  .sub-actions {
    display: flex;
    gap: 8px;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .btn-success {
    background: #059669;
    border: none;
    color: #ffffff;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s ease;
  }

  .btn-success:hover:not(:disabled) {
    background: #10b981;
  }

  .btn-danger {
    background: #dc2626;
    border: none;
    color: #ffffff;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s ease;
  }

  .btn-danger:hover:not(:disabled) {
    background: #ef4444;
  }

  .btn-success:disabled, .btn-danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .receipt-preview-panel {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 20px;
    min-height: 250px;
    display: flex;
    flex-direction: column;
  }

  .preview-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 700;
    color: #e2e8f0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 8px;
  }

  .receipt-img-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    overflow: hidden;
    padding: 8px;
  }

  .receipt-img {
    max-width: 100%;
    max-height: 350px;
    object-fit: contain;
    border-radius: 6px;
  }

  .preview-placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #64748b;
    padding: 24px;
  }

  .placeholder-icon {
    font-size: 28px;
    margin-bottom: 8px;
  }

  .preview-placeholder p {
    font-size: 13px;
    margin: 0;
    line-height: 1.4;
  }

  .error-text {
    color: #f87171;
    font-size: 13px;
    margin: 0;
  }

  @media (max-width: 900px) {
    .subscriptions-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
