<script lang="ts">
  import { onMount } from 'svelte';
  import { apiConfig, type ConnectionStatus } from '$lib/services/api-config.svelte';

  let inputUrl = $state<string>('');
  let isMinimized = $state<boolean>(true);
  let testResult = $state<{ success: boolean; message: string } | null>(null);
  let checking = $state<boolean>(false);

  // Sincronizar el input con la URL actual del gestor una vez cargado
  onMount(() => {
    inputUrl = apiConfig.baseUrl;
    // Si la conexión falla, forzar a abrir el panel para alertar al usuario
    if (apiConfig.connectionStatus === 'disconnected') {
      isMinimized = false;
    }
  });

  // Reaccionar cuando cambie el estado de conexión general
  $effect(() => {
    if (apiConfig.connectionStatus === 'disconnected') {
      isMinimized = false;
    }
  });

  async function handleConnect() {
    if (!inputUrl.trim()) {
      testResult = { success: false, message: 'La URL no puede estar vacía.' };
      return;
    }
    checking = true;
    testResult = null;
    
    const success = await apiConfig.connectToUrl(inputUrl.trim());
    checking = false;
    
    if (success) {
      testResult = { success: true, message: '¡Conectado exitosamente!' };
      // Ocultar automáticamente tras 1.5 segundos en caso de éxito
      setTimeout(() => {
        isMinimized = true;
        testResult = null;
      }, 1500);
    } else {
      testResult = { success: false, message: 'No se pudo conectar a la URL especificada.' };
    }
  }

  function handleResetLocal() {
    inputUrl = 'http://localhost:3000';
    handleConnect();
  }
</script>

<div class="api-debug-widget" class:minimized={isMinimized}>
  {#if isMinimized}
    <button class="toggle-btn ripple" onclick={() => isMinimized = false} aria-label="Abrir panel de conexión">
      <span class="pulse-indicator" class:connected={apiConfig.connectionStatus === 'connected'} class:testing={apiConfig.connectionStatus === 'testing'}></span>
      <svg class="gear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  {:else}
    <div class="panel-card">
      <div class="panel-header">
        <div class="status-group">
          <span class="pulse-indicator" class:connected={apiConfig.connectionStatus === 'connected'} class:testing={apiConfig.connectionStatus === 'testing'}></span>
          <span class="status-label">
            {#if apiConfig.connectionStatus === 'connected'}
              Conectado a la API
            {:else}
              API Desconectada
            {/if}
          </span>
        </div>
        <button class="close-icon-btn" onclick={() => isMinimized = true} aria-label="Minimizar">
          &times;
        </button>
      </div>

      <div class="panel-body">
        <p class="panel-info">Ingresa la URL de la API (por ejemplo, la provista por Codespaces):</p>
        
        <div class="input-group">
          <input 
            type="text" 
            placeholder="http://localhost:3000" 
            bind:value={inputUrl} 
            disabled={checking}
            class="url-input" 
          />
        </div>

        {#if testResult}
          <div class="result-msg" class:success={testResult.success}>
            {testResult.message}
          </div>
        {/if}

        <div class="actions-group">
          <button class="btn-connect" onclick={handleConnect} disabled={checking}>
            {checking ? 'Conectando...' : 'Conectar y Guardar'}
          </button>
          <button class="btn-reset" onclick={handleResetLocal} disabled={checking}>
            Usar Localhost
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .api-debug-widget {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    font-family: 'Inter', sans-serif;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* --- BOTON MINIMIZADO --- */
  .toggle-btn {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1);
    position: relative;
    padding: 0;
    transition: all 0.2s ease;
  }

  .toggle-btn:hover {
    background: rgba(30, 41, 59, 0.95);
    transform: scale(1.05) rotate(30deg);
    border-color: rgba(59, 130, 246, 0.4);
    color: #3b82f6;
  }

  .gear-icon {
    width: 24px;
    height: 24px;
  }

  /* --- INDICADOR DE ESTADO PULSANTE --- */
  .pulse-indicator {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #ef4444; /* Rojo por defecto (desconectado) */
    border: 2px solid #0f172a;
    box-shadow: 0 0 8px #ef4444;
  }

  .pulse-indicator.connected {
    background-color: #10b981; /* Verde (conectado) */
    box-shadow: 0 0 8px #10b981;
    animation: pulse 2s infinite;
  }

  .pulse-indicator.testing {
    background-color: #f59e0b; /* Amarillo (probando) */
    box-shadow: 0 0 8px #f59e0b;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(0.95); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 12px currentColor; }
    100% { transform: scale(0.95); opacity: 0.8; }
  }

  /* --- PANEL COMPLETO --- */
  .panel-card {
    width: 310px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7);
    overflow: hidden;
    animation: slide-up 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .panel-header {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-group {
    display: flex;
    align-items: center;
    gap: 24px;
    position: relative;
  }

  .status-group .pulse-indicator {
    position: static;
    border: none;
  }

  .status-label {
    font-size: 13px;
    font-weight: 700;
    color: #f1f5f9;
  }

  .close-icon-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
    padding: 4px;
    transition: color 0.2s;
  }

  .close-icon-btn:hover {
    color: #f1f5f9;
  }

  .panel-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .panel-info {
    font-size: 12px;
    line-height: 1.4;
    color: #94a3b8;
    margin: 0;
  }

  .url-input {
    width: 100%;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #f1f5f9;
    font-size: 12px;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }

  .url-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .result-msg {
    font-size: 11px;
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #fca5a5;
  }

  .result-msg.success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #a7f3d0;
  }

  .actions-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
  }

  .btn-connect {
    background: linear-gradient(90deg, #2563eb, #1d4ed8);
    border: none;
    border-radius: 8px;
    color: #ffffff;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    padding: 10px;
    transition: all 0.2s;
  }

  .btn-connect:hover:not(:disabled) {
    background: linear-gradient(90deg, #3b82f6, #2563eb);
  }

  .btn-reset {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #94a3b8;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    padding: 8px;
    transition: all 0.2s;
  }

  .btn-reset:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.03);
    color: #f1f5f9;
    border-color: rgba(255, 255, 255, 0.2);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
