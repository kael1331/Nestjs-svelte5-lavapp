<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/features/auth/services/auth-store.svelte';
  import { navStore } from '$lib/components/layout/nav-store.svelte';
  import { apiConfig } from '$lib/services/api-config.svelte';

  let carWash = $state<any>(null);
  let platformSettings = $state<any>(null);
  let subscriptions = $state<any[]>([]);
  let loadingWash = $state<boolean>(true);
  let loadingSubscriptions = $state<boolean>(false);
  let uploading = $state<boolean>(false);
  let uploadError = $state<string>('');
  let uploadSuccess = $state<string>('');
  let fileInput = $state<HTMLInputElement>();

  async function fetchWashStatus() {
    try {
      loadingWash = true;
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/my-wash`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        carWash = await res.json();
      }
    } catch (e) {
      console.error('Error fetching wash:', e);
    } finally {
      loadingWash = false;
    }
  }

  async function fetchPlatformSettings() {
    try {
      const res = await fetch(`${apiConfig.baseUrl}/platform-settings`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });
      if (res.ok) {
        platformSettings = await res.json();
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  }

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

  onMount(async () => {
    navStore.reset('home');
    await fetchWashStatus();
    await fetchPlatformSettings();
    await fetchSubscriptions();
  });

  const latestSub = $derived(
    subscriptions.length > 0 ? subscriptions[0] : null
  );

  async function handleUploadReceipt() {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      uploadError = 'Por favor selecciona la imagen de tu comprobante.';
      return;
    }
    uploading = true;
    uploadError = '';
    uploadSuccess = '';
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
      const res = await fetch(`${apiConfig.baseUrl}/car-washes/my-wash/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        },
        body: formData
      });
      if (res.ok) {
        uploadSuccess = '¡Comprobante enviado con éxito! Tu pago está en revisión.';
        if (fileInput) fileInput.value = '';
        await fetchWashStatus();
        await fetchSubscriptions();
      } else {
        const errData = await res.json();
        uploadError = errData.message || 'Error al subir el comprobante.';
      }
    } catch (e) {
      uploadError = 'Error de conexión con el servidor.';
    } finally {
      uploading = false;
    }
  }
</script>

<svelte:head>
  <title>Dashboard Administrador - LavaApp</title>
</svelte:head>

{#if loadingWash}
  <div class="loading-container">
    <div class="spinner"></div>
    <p>Cargando información del lavadero...</p>
  </div>
{:else}
  <div class="dashboard-card">
    <div class="tab-content">
      {#if navStore.activeTab === 'home'}
        <div class="content-panel">
          <h3 class="panel-subtitle">Panel de Control: Administrador</h3>
          <p class="welcome-text">Gestión y control de operaciones del lavadero.</p>

          {#if carWash && !carWash.isServiceActive}
            <div class="alert-box-inline">
              <span class="warning-icon">⚠️</span>
              <div>
                <h4 class="alert-title">Suscripción Inactiva</h4>
                <p class="alert-description">
                  Tu lavadero se encuentra desactivado y no figura públicamente.
                  Realiza la transferencia y carga tu comprobante de pago en la pestaña <strong>Mi Membresía</strong> para activarlo.
                </p>
              </div>
            </div>
          {/if}

          <div class="user-info-box">
            <div class="info-row">
              <span class="info-label">Nombre del Lavadero:</span>
              <span class="info-value">{carWash?.name || 'Mi Lavadero'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Administrador:</span>
              <span class="info-value">{authStore.user?.name || 'Administrador'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email de contacto:</span>
              <span class="info-value">{authStore.user?.email || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Estado del Servicio:</span>
              <span class="info-value" class:text-active={carWash?.isServiceActive} class:text-inactive={!carWash?.isServiceActive}>
                {carWash?.isServiceActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Membresía Vence:</span>
              <span class="info-value highlight-green">
                {carWash?.subscriptionExpiresAt ? new Date(carWash.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

      {:else if navStore.activeTab === 'operations'}
        <div class="content-panel">
          <h3 class="panel-subtitle">Operaciones Activas</h3>
          
          {#if carWash && !carWash.isServiceActive}
            <div class="alert-box">
              <span class="warning-icon">⚠️</span>
              <div>
                <h4 class="alert-title">Acceso Restringido</h4>
                <p class="alert-description">Esta sección requiere que tu membresía esté activa. Por favor, ve a la pestaña <strong>Mi Membresía</strong> para habilitar el servicio.</p>
              </div>
            </div>
          {:else}
            <div class="admin-actions-placeholder">
              <p>Supervisión y asignación de pedidos de lavandería, asignación de tareas de delivery y control de insumos en próximas fases.</p>
            </div>
          {/if}
        </div>

      {:else if navStore.activeTab === 'membership'}
        <div class="content-panel">
          <h3 class="panel-subtitle">Gestión de Membresía</h3>
          <p class="section-desc">Consulta los datos para tu membresía mensual, sube comprobantes de transferencia o revisa tu historial de pagos.</p>

          <div class="membership-layout">
            <!-- Panel de Pago -->
            <div class="payment-card-static">
              <h4 class="payment-title">Renovar / Activar Suscripción</h4>
              <p class="payment-subtitle">Realiza una transferencia bancaria con los siguientes datos y sube tu comprobante. Puedes realizar renovaciones anticipadas y los 30 días se acumularán al final de tu período actual.</p>

              <div class="transfer-details">
                <div class="detail-item">
                  <span class="detail-label">Monto de la Membresía:</span>
                  <span class="detail-value font-outfit">${platformSettings?.subscriptionPrice ?? '1500'} ARS</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Alias de Transferencia:</span>
                  <span class="detail-value highlight font-outfit">{platformSettings?.superadminAlias ?? 'plataforma.lavados.alias'}</span>
                </div>
              </div>

              {#if latestSub && latestSub.status === 'pending'}
                <div class="status-box pending">
                  <div class="spinner-small"></div>
                  <div>
                    <h5 class="status-title">Comprobante en Revisión</h5>
                    <p class="status-desc">Subido el {new Date(latestSub.createdAt).toLocaleDateString()} a las {new Date(latestSub.createdAt).toLocaleTimeString()}. Nuestro equipo de soporte validará la transferencia a la brevedad.</p>
                  </div>
                </div>
              {:else}
                {#if latestSub && latestSub.status === 'rejected'}
                  <div class="status-box rejected">
                    <span class="status-icon">❌</span>
                    <div>
                      <h5 class="status-title">Pago Rechazado</h5>
                      <p class="status-desc">El comprobante anterior fue rechazado. Por favor, verifica el monto transferido y vuelve a subir una captura del comprobante válido.</p>
                    </div>
                  </div>
                {/if}

                <div class="upload-section">
                  <label for="receipt-file" class="file-label">Sube la captura de tu comprobante:</label>
                  <input type="file" id="receipt-file" accept="image/*" bind:this={fileInput} class="file-input" />
                  
                  {#if uploadError}
                    <p class="error-msg">{uploadError}</p>
                  {/if}
                  {#if uploadSuccess}
                    <p class="success-msg">{uploadSuccess}</p>
                  {/if}

                  <button onclick={handleUploadReceipt} disabled={uploading} class="btn-primary">
                    {uploading ? 'Enviando comprobante...' : 'Enviar Comprobante'}
                  </button>
                </div>
              {/if}
            </div>

            <!-- Historial de Pagos -->
            <div class="history-card">
              <h4 class="payment-title">Historial de Pagos</h4>
              
              {#if loadingSubscriptions}
                <div class="loading-box-inline">
                  <div class="spinner-small"></div>
                  <p>Cargando historial...</p>
                </div>
              {:else if subscriptions.length === 0}
                <p class="empty-history">No se registran pagos previos en la plataforma.</p>
              {:else}
                <div class="history-list">
                  {#each subscriptions as sub}
                    <div class="history-item">
                      <div class="history-info">
                        <span class="history-date">{new Date(sub.createdAt).toLocaleDateString()} - {new Date(sub.createdAt).toLocaleTimeString()}</span>
                        <span class="history-amount">Monto: ${sub.amountPaid} ARS</span>
                      </div>
                      <span class="status-badge badge-{sub.status}">
                        {sub.status === 'pending' ? 'Pendiente' : sub.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 0;
    color: #94a3b8;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(59, 130, 246, 0.1);
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  .spinner-small {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(59, 130, 246, 0.1);
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .alert-box {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .alert-box-inline {
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 24px;
    max-width: 500px;
  }

  .warning-icon {
    font-size: 24px;
    line-height: 1;
  }

  .alert-title {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 700;
    color: #f87171;
  }

  .alert-description {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #cbd5e1;
  }

  .payment-card-static {
    background: rgba(30, 41, 59, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 24px;
  }

  .payment-title {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 700;
    color: #f1f5f9;
    font-family: 'Outfit', sans-serif;
  }

  .payment-subtitle {
    margin: 0 0 20px 0;
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.5;
  }

  .transfer-details {
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
  }

  .detail-label {
    color: #94a3b8;
  }

  .detail-value {
    color: #f1f5f9;
    font-weight: 700;
  }

  .detail-value.highlight {
    color: #60a5fa;
  }

  .font-outfit {
    font-family: 'Outfit', sans-serif;
  }

  .status-box {
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .status-box.pending {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    color: #93c5fd;
  }

  .status-box.rejected {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .status-title {
    margin: 0 0 4px 0;
    font-size: 15px;
    font-weight: 700;
  }

  .status-desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
  }

  .status-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .upload-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .file-label {
    font-size: 13px;
    font-weight: 600;
    color: #cbd5e1;
  }

  .file-input {
    background: rgba(15, 23, 42, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px;
    color: #cbd5e1;
    font-size: 13px;
    width: 100%;
    box-sizing: border-box;
    cursor: pointer;
  }

  .error-msg {
    color: #f87171;
    font-size: 13px;
    margin: 4px 0 0 0;
  }

  .success-msg {
    color: #4ade80;
    font-size: 13px;
    margin: 4px 0 0 0;
  }

  .btn-primary {
    background: linear-gradient(90deg, #2563eb, #1d4ed8);
    border: none;
    border-radius: 8px;
    color: #ffffff;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    padding: 12px 24px;
    transition: all 0.2s ease;
    width: 100%;
    margin-top: 8px;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(90deg, #3b82f6, #2563eb);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }

  /* --- DASHBOARD ACTIVO --- */
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

  .welcome-text {
    font-size: 15px;
    color: #94a3b8;
    margin-bottom: 24px;
  }

  .user-info-box {
    background: rgba(15, 23, 42, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 500px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }

  .info-label {
    color: #94a3b8;
  }

  .info-value {
    color: #f1f5f9;
    font-weight: 500;
  }

  .text-active {
    color: #10b981;
    font-weight: 600;
  }

  .text-inactive {
    color: #ef4444;
    font-weight: 600;
  }

  .highlight-green {
    color: #34d399;
    font-weight: 600;
  }

  .admin-actions-placeholder {
    font-size: 14px;
    color: #94a3b8;
    line-height: 1.6;
    border-left: 3px solid #3b82f6;
    padding-left: 16px;
  }

  /* Membership Section Grid Layout */
  .membership-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-items: start;
    margin-top: 16px;
  }

  .history-card {
    background: rgba(30, 41, 59, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
  }

  .empty-history {
    color: #64748b;
    font-size: 13px;
    font-style: italic;
    margin: 16px 0;
  }

  .loading-box-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #94a3b8;
    padding: 16px 0;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 8px;
  }

  .history-item {
    background: rgba(15, 23, 42, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .history-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .history-date {
    font-size: 12px;
    color: #94a3b8;
  }

  .history-amount {
    font-size: 13px;
    font-weight: 600;
    color: #f1f5f9;
  }

  .status-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
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

  .section-desc {
    font-size: 13px;
    color: #94a3b8;
    margin-bottom: 24px;
  }

  @media (max-width: 900px) {
    .membership-layout {
      grid-template-columns: 1fr;
      gap: 24px;
    }
  }
</style>
