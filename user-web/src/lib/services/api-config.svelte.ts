import { browser } from '$app/environment';

export type ConnectionStatus = 'testing' | 'connected' | 'disconnected';

class ApiConfig {
  baseUrl = $state<string>('http://localhost:3000');
  connectionStatus = $state<ConnectionStatus>('testing');
  initialized = $state<boolean>(false);

  constructor() {
    if (browser) {
      this.initialize();
    }
  }

  // Comprueba si un servidor responde (hace un fetch rápido con timeout de 2 segundos)
  async testConnection(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${url}/`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Protocolo de inicialización:
  // 1. Probar localhost:3000
  // 2. Si falla, probar URL en localStorage
  // 3. Si falla o no hay, marcar como desconectado
  async initialize() {
    this.connectionStatus = 'testing';
    
    // 1. Probar localhost
    const localUrl = 'http://localhost:3000';
    console.log('Probando conexión local con NestJS...');
    const localConnected = await this.testConnection(localUrl);

    if (localConnected) {
      this.baseUrl = localUrl;
      this.connectionStatus = 'connected';
      this.initialized = true;
      console.log('Conexión automática exitosa con Localhost:3000');
      return;
    }

    // 2. Probar URL guardada en localStorage
    const savedUrl = localStorage.getItem('api_custom_url');
    if (savedUrl) {
      console.log(`Localhost no responde. Probando URL guardada: ${savedUrl}`);
      const savedConnected = await this.testConnection(savedUrl);
      if (savedConnected) {
        this.baseUrl = savedUrl;
        this.connectionStatus = 'connected';
        this.initialized = true;
        console.log('Conexión exitosa con la URL guardada en localStorage');
        return;
      }
    }

    // 3. Si todo falla, marcar como desconectado para pedir la URL
    console.log('No se pudo establecer conexión con ninguna API.');
    this.connectionStatus = 'disconnected';
    this.initialized = true;
  }

  // Permite ingresar manualmente una nueva URL de API (ej. desde el panel de depuración)
  async connectToUrl(url: string): Promise<boolean> {
    this.connectionStatus = 'testing';
    // Limpiar barra diagonal al final si el usuario la incluyó
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

    const isOk = await this.testConnection(cleanUrl);
    if (isOk) {
      this.baseUrl = cleanUrl;
      this.connectionStatus = 'connected';
      localStorage.setItem('api_custom_url', cleanUrl);
      return true;
    } else {
      this.connectionStatus = 'disconnected';
      return false;
    }
  }

  // Desconectar manualmente para testing
  disconnect() {
    this.connectionStatus = 'disconnected';
    if (browser) {
      localStorage.removeItem('api_custom_url');
    }
  }
}

export const apiConfig = new ApiConfig();
