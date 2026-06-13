<script lang="ts">
  import { onMount } from 'svelte';
  import { navStore } from '$lib/components/layout/nav-store.svelte';
  import { authStore } from '$lib/features/auth/services/auth-store.svelte';
  import { apiConfig } from '$lib/services/api-config.svelte';
  import UserCrud from '$lib/features/users/components/UserCrud.svelte';

  // Subscriptions State
  let subscriptions = $state<any[]>([]);
  let loadingSubscriptions = $state<boolean>(false);
  let actionInProgress = $state<string | null>(null);
  let selectedReceiptUrl = $state<string | null>(null);
  let receiptImageBlobUrl = $state<string | null>(null);
  let receiptLoading = $state<boolean>(false);
  let filterStatus = $state<string>('all');

  // Platform Settings State
  let alias = $state<string>('');
  let price = $state<number>(0);
  let loadingSettings = $state<boolean>(false);
  let savingSettings = $state<boolean>(false);

  // Modal State
  let isModalOpen = $state<boolean>(false);

  // Derived filter
  const filteredSubscriptions = $derived(
    filterStatus === 'all'
      ? subscriptions
      : subscriptions.filter((sub) => sub.status === filterStatus)
  );

  async function fetchSubscriptions() {
    try {
      loadingSubscriptions = true;
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/subscriptions`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        subscriptions = await res.json();
      }
    } catch (e) {
      console.error('Error fetching subscriptions:', e);
    } finally {
      loadingSubscriptions = false;
    }
  }

  async function fetchSettings() {
    try {
      loadingSettings = true;
      const res = await fetch(`${apiConfig.baseUrl}/platform-settings`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        alias = data.superadminAlias;
        price = data.subscriptionPrice;
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    } finally {
      loadingSettings = false;
    }
  }

  async function handleSaveSettings() {
    try {
      savingSettings = true;
      const res = await fetch(`${apiConfig.baseUrl}/platform-settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          superadminAlias: alias,
          subscriptionPrice: price
        })
      });
      if (res.ok) {
        alert('Configuraciones globales actualizadas con éxito.');
        await fetchSettings();
      } else {
        alert('Error al guardar las configuraciones.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al guardar configuraciones.');
    } finally {
      savingSettings = false;
    }
  }

  onMount(() => {
    navStore.reset('home');
    fetchSubscriptions();
    fetchSettings();
  });

  async function selectReceipt(url: string | null) {
    if (receiptImageBlobUrl) {
      URL.revokeObjectURL(receiptImageBlobUrl);
      receiptImageBlobUrl = null;
    }
    selectedReceiptUrl = url;
    if (!url) return;

    try {
      receiptLoading = true;
      const filename = url.split('/').pop();
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/subscriptions/receipts/${filename}`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      receiptImageBlobUrl = URL.createObjectURL(blob);
    } catch (err) {
      console.error('Error loading receipt image:', err);
    } finally {
      receiptLoading = false;
    }
  }

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
        await selectReceipt(null);
        await fetchSubscriptions();
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
        await selectReceipt(null);
        await fetchSubscriptions();
      } else {
        alert('Error al rechazar la suscripción.');
      }
    } catch (e) {
      alert('Error de conexión.');
    } finally {
      actionInProgress = null;
    }
  }

  function openReceiptModal() {
    isModalOpen = true;
  }

  function closeModal() {
    isModalOpen = false;
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
        <h3 class="panel-subtitle">Validar y Gestionar Suscripciones</h3>
        <p class="section-desc">Filtra y revisa las transferencias bancarias de los lavaderos para administrar su estado de membresía.</p>

        <!-- Filtros de estado -->
        <div class="filter-bar">
          <button class="filter-btn" class:active={filterStatus === 'all'} onclick={() => { filterStatus = 'all'; selectReceipt(null); }}>
            Todas ({subscriptions.length})
          </button>
          <button class="filter-btn" class:active={filterStatus === 'pending'} onclick={() => { filterStatus = 'pending'; selectReceipt(null); }}>
            Pendientes ({subscriptions.filter(s => s.status === 'pending').length})
          </button>
          <button class="filter-btn" class:active={filterStatus === 'approved'} onclick={() => { filterStatus = 'approved'; selectReceipt(null); }}>
            Aprobadas ({subscriptions.filter(s => s.status === 'approved').length})
          </button>
          <button class="filter-btn" class:active={filterStatus === 'rejected'} onclick={() => { filterStatus = 'rejected'; selectReceipt(null); }}>
            Rechazadas ({subscriptions.filter(s => s.status === 'rejected').length})
          </button>
        </div>

        {#if loadingSubscriptions}
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Cargando suscripciones...</p>
          </div>
        {:else if filteredSubscriptions.length === 0}
          <div class="empty-state">
            <span class="empty-icon">📂</span>
            <p class="empty-text">No se encontraron suscripciones en esta categoría.</p>
          </div>
        {:else}
          <div class="subscriptions-layout">
            <div class="subscriptions-list">
              {#each filteredSubscriptions as sub}
                <div class="subscription-item" class:active={selectedReceiptUrl === sub.receiptUrl}>
                  <div class="sub-info">
                    <div class="sub-title-row">
                      <span class="sub-wash-name">{sub.carWash?.name || 'Lavadero sin nombre'}</span>
                      <span class="status-badge badge-{sub.status}">
                        {sub.status === 'pending' ? 'Pendiente' : sub.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                      </span>
                    </div>
                    <span class="sub-details">Monto: ${sub.amountPaid} | Creado: {new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div class="sub-actions">
                    <button class="btn-secondary" onclick={() => selectReceipt(sub.receiptUrl)}>
                      Ver Comprobante
                    </button>
                    {#if sub.status === 'pending'}
                      <button class="btn-success" disabled={actionInProgress !== null} onclick={() => handleApprove(sub.id)}>
                        {actionInProgress === sub.id ? 'Aprobando...' : 'Aprobar'}
                      </button>
                      <button class="btn-danger" disabled={actionInProgress !== null} onclick={() => handleReject(sub.id)}>
                        {actionInProgress === sub.id ? 'Rechazando...' : 'Rechazar'}
                      </button>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>

            <!-- Previsualización de Comprobante -->
            <div class="receipt-preview-panel">
              {#if selectedReceiptUrl}
                <h4 class="preview-title">Detalle del Comprobante</h4>
                <div class="receipt-img-container" onclick={openReceiptModal} style="cursor: pointer;" title="Haga clic para agrandar">
                  {#if receiptLoading}
                    <div class="spinner-small"></div>
                    <p>Descargando imagen segura...</p>
                  {:else if receiptImageBlobUrl}
                    <img src={receiptImageBlobUrl} alt="Comprobante de Pago" class="receipt-img" />
                    <span class="zoom-hint">🔍 Clic para ampliar</span>
                  {:else}
                    <p class="error-text">No se pudo cargar la imagen.</p>
                  {/if}
                </div>
              {:else}
                <div class="preview-placeholder">
                  <span class="placeholder-icon">👁️</span>
                  <p>Selecciona una suscripción de la lista para ver el comprobante y validarlo.</p>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {:else if navStore.activeTab === 'config'}
      <div class="content-panel">
        <h3 class="panel-subtitle">Configuración del Sistema</h3>
        <p class="section-desc">Configura los parámetros globales de la membresía del lavadero.</p>

        {#if loadingSettings}
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Cargando configuraciones...</p>
          </div>
        {:else}
          <form onsubmit={(e) => { e.preventDefault(); handleSaveSettings(); }} class="config-form">
            <div class="form-group">
              <label for="alias-input" class="form-label">Alias Bancario de Transferencia</label>
              <input
                id="alias-input"
                type="text"
                bind:value={alias}
                placeholder="Ej. plataforma.lavados.alias"
                class="form-input"
                required
              />
              <span class="form-hint">Este es el alias bancario o CBU donde los administradores realizarán la transferencia para pagar su suscripción.</span>
            </div>

            <div class="form-group">
              <label for="price-input" class="form-label">Costo de Suscripción Mensual ($)</label>
              <input
                id="price-input"
                type="number"
                step="0.01"
                min="0"
                bind:value={price}
                class="form-input"
                required
              />
              <span class="form-hint">Monto mensual en pesos que el administrador del lavadero debe transferir para habilitar su servicio.</span>
            </div>

            <button type="submit" class="btn-primary" disabled={savingSettings}>
              {savingSettings ? 'Guardando...' : 'Guardar Configuraciones'}
            </button>
          </form>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Modal para ver comprobante en grande -->
{#if isModalOpen && receiptImageBlobUrl}
  <div class="modal-backdrop" onclick={closeModal}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <button class="modal-close-btn" onclick={closeModal}>&times;</button>
      <img src={receiptImageBlobUrl} alt="Comprobante de Pago Completo" class="modal-large-img" />
    </div>
  </div>
{/if}

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
    margin: 0 0 4px 0;
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

  .section-desc {
    font-size: 14px;
    color: #94a3b8;
    margin-bottom: 24px;
  }

  .filter-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 12px;
  }

  .filter-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .filter-btn:hover {
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.25);
  }

  .filter-btn.active {
    background: rgba(59, 130, 246, 0.15);
    border-color: #3b82f6;
    color: #3b82f6;
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
    grid-template-columns: 1fr 340px;
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
    gap: 6px;
    flex: 1;
  }

  .sub-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sub-wash-name {
    font-size: 15px;
    font-weight: 700;
    color: #f1f5f9;
  }

  .status-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
    text-transform: uppercase;
  }

  .badge-pending {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .badge-approved {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .badge-rejected {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
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
    position: relative;
    border: 1px dashed rgba(255, 255, 255, 0.1);
  }

  .receipt-img-container:hover {
    border-color: rgba(59, 130, 246, 0.3);
  }

  .receipt-img {
    max-width: 100%;
    max-height: 300px;
    object-fit: contain;
    border-radius: 6px;
  }

  .zoom-hint {
    display: block;
    margin-top: 8px;
    font-size: 11px;
    color: #94a3b8;
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

  /* Config Form Styles */
  .config-form {
    max-width: 500px;
    background: rgba(30, 41, 59, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;
  }

  .form-input {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    background: rgba(15, 23, 42, 0.8);
  }

  .form-hint {
    font-size: 11px;
    color: #64748b;
    line-height: 1.4;
  }

  .btn-primary {
    align-self: flex-start;
    background: #3b82f6;
    border: none;
    color: #ffffff;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s ease;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .modal-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-close-btn {
    position: absolute;
    top: -40px;
    right: 0;
    background: transparent;
    border: none;
    color: #ffffff;
    font-size: 36px;
    cursor: pointer;
  }

  .modal-close-btn:hover {
    color: #ef4444;
  }

  .modal-large-img {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 900px) {
    .subscriptions-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
