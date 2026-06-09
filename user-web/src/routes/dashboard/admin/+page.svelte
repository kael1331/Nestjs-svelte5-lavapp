<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/features/auth/services/auth-store.svelte';
  import { navStore } from '$lib/components/layout/nav-store.svelte';
  import { apiConfig } from '$lib/services/api-config.svelte';

  let carWash = $state<any>(null);
  let platformSettings = $state<any>(null);
  let loadingWash = $state<boolean>(true);
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
      const res = await fetch(`${apiConfig.baseUrl}/platform-settings`);
      if (res.ok) {
        platformSettings = await res.json();
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  }

  onMount(async () => {
    navStore.reset('home');
    await fetchWashStatus();
    await fetchPlatformSettings();
  });

  const latestSubscription = $derived(() => {
    if (!carWash || !carWash.subscriptions || carWash.subscriptions.length === 0) {
      return null;
    }
    return [...carWash.subscriptions].sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  });

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
        await fetchWashStatus();
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
{:else if carWash && !carWash.isServiceActive}
  <div class="activation-required-container">
    <div class="alert-box">
      <span class="warning-icon">⚠️</span>
      <div>
        <h4 class="alert-title">Suscripción Inactiva</h4>
        <p class="alert-description">Tu lavadero se encuentra desactivado. Debes abonar la suscripción mensual para poder operar y publicar tus servicios.</p>
      </div>
    </div>

    <!-- Panel de Pago -->
    <div class="payment-card">
      <h3 class="payment-title">Activar Suscripción</h3>
      <p class="payment-subtitle">Realiza una transferencia bancaria con los siguientes datos y sube tu comprobante de pago.</p>

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

      {#if latestSubscription() && latestSubscription().status === 'pending'}
        <div class="status-box pending">
          <div class="spinner-small"></div>
          <div>
            <h5 class="status-title">Comprobante en Revisión</h5>
            <p class="status-desc">Subido el {new Date(latestSubscription().createdAt).toLocaleDateString()} a las {new Date(latestSubscription().createdAt).toLocaleTimeString()}. Nuestro equipo de soporte validará la transferencia a la brevedad.</p>
          </div>
        </div>
      {:else}
        {#if latestSubscription() && latestSubscription().status === 'rejected'}
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
  </div>
{:else}
  <!-- El lavadero está activo: Mostrar el dashboard normal -->
  <div class="dashboard-card">
    <div class="tab-content">
      {#if navStore.activeTab === 'home'}
        <div class="content-panel">
          <h3 class="panel-subtitle">Panel de Control: Administrador</h3>
          <p class="welcome-text">Gestión y control de operaciones del lavadero.</p>
          
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
              <span class="info-label">Membresía Vence:</span>
              <span class="info-value highlight-green">{carWash?.subscriptionExpiresAt ? new Date(carWash.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      {:else if navStore.activeTab === 'operations'}
        <div class="content-panel">
          <h3 class="panel-subtitle">Operaciones Activas</h3>
          <div class="admin-actions-placeholder">
            <p>Supervisión y asignación de pedidos de lavandería, asignación de tareas de delivery y control de insumos en próximas fases.</p>
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

  .activation-required-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 650px;
    margin: 0 auto;
    font-family: 'Inter', sans-serif;
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
    color: #fca5a5;
  }

  .payment-card {
    background: rgba(30, 41, 59, 0.4);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  }

  .payment-title {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 800;
    color: #f1f5f9;
    font-family: 'Outfit', sans-serif;
  }

  .payment-subtitle {
    margin: 0 0 24px 0;
    font-size: 14px;
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
    margin-bottom: 24px;
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
    font-size: 14px;
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
    font-size: 14px;
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
    margin: 0 0 12px 0;
    font-size: 22px;
    color: #f1f5f9;
    font-family: 'Outfit', sans-serif;
  }

  .welcome-text {
    font-size: 16px;
    color: #e2e8f0;
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
    max-width: 450px;
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

  .info-value.highlight-green {
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
</style>
