<script lang="ts">
  import { authStore } from '$lib/features/auth/services/auth-store.svelte';
  import { goto } from '$app/navigation';

  let email = $state('');
  let password = $state('');
  
  let regName = $state('');
  let regEmail = $state('');
  let regPassword = $state('');
  let regRole = $state('client');

  let isRegisterMode = $state(false);
  let errorMessage = $state('');
  let successMessage = $state('');

  $effect(() => {
    if (authStore.user) {
      redirectToDashboard(authStore.user.role);
    }
  });

  async function handleGoogleCredentialResponse(response: any) {
    errorMessage = '';
    successMessage = '';
    const ok = await authStore.loginWithGoogle(response.credential);
    if (ok && authStore.user) {
      redirectToDashboard(authStore.user.role);
    } else {
      errorMessage = 'Error: No se pudo iniciar sesión con Google.';
    }
  }

  $effect(() => {
    if (typeof window !== 'undefined') {
      const initGoogle = () => {
        const win = window as any;
        if (win.google && win.google.accounts) {
          win.google.accounts.id.initialize({
            client_id: '133806765476-l4vlgdm105bauerb58l1u0t8g8k020u3.apps.googleusercontent.com',
            callback: handleGoogleCredentialResponse
          });
          
          const btnContainer = document.getElementById('google-signin-btn');
          if (btnContainer) {
            win.google.accounts.id.renderButton(btnContainer, {
              theme: 'filled_blue',
              size: 'large',
              width: 320
            });
          }
        } else {
          setTimeout(initGoogle, 200);
        }
      };
      initGoogle();
    }
  });

  function redirectToDashboard(role: string) {
    if (role === 'super_admin') {
      goto('/dashboard/super-admin');
    } else if (role === 'admin') {
      goto('/dashboard/admin');
    } else {
      goto('/dashboard/client');
    }
  }

  async function handleLogin(e: Event) {
    e.preventDefault();
    errorMessage = '';
    successMessage = '';
    const ok = await authStore.login(email, password);
    if (ok && authStore.user) {
      redirectToDashboard(authStore.user.role);
    } else {
      errorMessage = 'Error: Credenciales inválidas o error de red.';
    }
  }

  async function handleRegister(e: Event) {
    e.preventDefault();
    errorMessage = '';
    successMessage = '';
    const ok = await authStore.register(regName, regEmail, regPassword, regRole);
    if (ok) {
      successMessage = 'Usuario registrado exitosamente. Por favor inicia sesión.';
      isRegisterMode = false;
      email = regEmail;
      password = '';
    } else {
      errorMessage = 'Error: No se pudo registrar el usuario. El correo podría estar en uso.';
    }
  }
</script>

<svelte:head>
  <title>LavaYa - {isRegisterMode ? 'Registrarse' : 'Iniciar Sesión'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<main class="login-container">
  <div class="glass-card">
    <!-- CABECERA CON LOGOTIPO DE LAVAYA -->
    <div class="login-header">
      <div class="logo-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="logo-icon">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="none" stroke="#1d6ce3" stroke-width="2.2"/>
          <path d="M7 14h10m-10 0a1 1 0 0 0-1 1v2.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V15a1 1 0 0 0-1-1m-9 0V12.5a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5V14" stroke="#ffffff" stroke-width="1.8"/>
          <circle cx="8.5" cy="15.5" r="0.75" fill="#ffffff"/>
          <circle cx="15.5" cy="15.5" r="0.75" fill="#ffffff"/>
        </svg>
        <span class="logo-text">Lava<span class="blue-text">Ya</span></span>
      </div>
      <h2>{isRegisterMode ? 'Crear cuenta' : '¡Te damos la bienvenida!'}</h2>
      <p class="subtitle">{isRegisterMode ? 'Completa los datos para registrarte en la plataforma' : 'Ingresa tus datos para acceder a tu panel'}</p>
    </div>

    <!-- ALERTAS DE ESTADO -->
    {#if errorMessage}
      <div class="status-alert error">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        <span>{errorMessage}</span>
      </div>
    {/if}

    {#if successMessage}
      <div class="status-alert success">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>{successMessage}</span>
      </div>
    {/if}

    <!-- FORMULARIO DE INICIO DE SESIÓN -->
    {#if !isRegisterMode}
      <form onsubmit={handleLogin} class="auth-form">
        <div class="form-group">
          <label for="login-email">Correo electrónico</label>
          <input 
            type="email" 
            id="login-email" 
            bind:value={email} 
            placeholder="correo@ejemplo.com" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="login-password">Contraseña</label>
          <input 
            type="password" 
            id="login-password" 
            bind:value={password} 
            placeholder="••••••••" 
            required 
          />
        </div>

        <button type="submit" class="submit-btn">
          Ingresar
        </button>
      </form>

      <p class="toggle-mode-text">
        ¿No tienes cuenta? 
        <button onclick={() => { isRegisterMode = true; errorMessage = ''; successMessage = ''; }} class="toggle-mode-btn">
          Registrate aquí
        </button>
      </p>
    {:else}
      <!-- FORMULARIO DE REGISTRO -->
      <form onsubmit={handleRegister} class="auth-form">
        <div class="form-group">
          <label for="reg-name">Nombre completo</label>
          <input 
            type="text" 
            id="reg-name" 
            bind:value={regName} 
            placeholder="Ej. Juan Pérez" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="reg-email">Correo electrónico</label>
          <input 
            type="email" 
            id="reg-email" 
            bind:value={regEmail} 
            placeholder="correo@ejemplo.com" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="reg-password">Contraseña</label>
          <input 
            type="password" 
            id="reg-password" 
            bind:value={regPassword} 
            placeholder="Mínimo 6 caracteres" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="reg-role">Rol de usuario</label>
          <select id="reg-role" bind:value={regRole} class="select-input">
            <option value="client">Cliente</option>
            <option value="admin">Administrador</option>
            <option value="super_admin">Súper Administrador</option>
          </select>
        </div>

        <button type="submit" class="submit-btn">
          Registrar Cuenta
        </button>
      </form>

      <p class="toggle-mode-text">
        ¿Ya tienes cuenta? 
        <button onclick={() => { isRegisterMode = false; errorMessage = ''; successMessage = ''; }} class="toggle-mode-btn">
          Inicia sesión aquí
        </button>
      </p>
    {/if}

    <!-- SEPARADOR Y GOOGLE OAUTH -->
    <div class="google-divider">
      <span class="divider-text">O accede directamente con</span>
      <div id="google-signin-btn"></div>
    </div>

    <!-- RETORNO AL INICIO -->
    <div class="back-home-wrapper">
      <a href="/" class="back-home-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="5" y1="12" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Volver al Inicio
      </a>
    </div>
  </div>
</main>

<style>
  :global(body) {
    background: radial-gradient(circle at top, #0f172a 0%, #020617 100%);
    color: #f8fafc;
    font-family: 'Outfit', sans-serif;
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }

  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 30px 20px;
    box-sizing: border-box;
    background-image: radial-gradient(circle at 10% 20%, rgba(29, 108, 227, 0.1) 0%, transparent 45%);
  }

  .glass-card {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 40px;
    max-width: 440px;
    width: 100%;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    box-sizing: border-box;
    animation: scaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes scaleUp {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }

  .login-header {
    text-align: center;
    margin-bottom: 28px;
  }

  .logo-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
  }

  .logo-text {
    font-size: 1.6rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.04em;
  }

  .blue-text {
    color: #1d6ce3;
  }

  h2 {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0 0 6px 0;
    color: #ffffff;
    letter-spacing: -0.02em;
  }

  .subtitle {
    color: #94a3b8;
    font-size: 0.85rem;
    margin: 0;
    line-height: 1.4;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
  }

  label {
    font-size: 0.8rem;
    color: #cbd5e1;
    font-weight: 500;
  }

  input, .select-input {
    background: rgba(2, 6, 17, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 11px 16px;
    color: #f8fafc;
    font-size: 0.9rem;
    transition: all 0.2s;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus, .select-input:focus {
    outline: none;
    border-color: #1d6ce3;
    background: rgba(2, 6, 17, 0.65);
    box-shadow: 0 0 0 3px rgba(29, 108, 227, 0.25);
  }

  .select-input option {
    background-color: #0b0f19;
    color: #f8fafc;
  }

  .submit-btn {
    background: linear-gradient(135deg, #1d6ce3 0%, #1e40af 100%);
    border: none;
    border-radius: 12px;
    padding: 13px;
    color: #ffffff;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(29, 108, 227, 0.25);
    margin-top: 8px;
  }

  .submit-btn:hover {
    opacity: 0.95;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(29, 108, 227, 0.35);
  }

  .submit-btn:active {
    transform: translateY(0);
  }

  .toggle-mode-text {
    text-align: center;
    font-size: 0.85rem;
    color: #cbd5e1;
    margin-top: 16px;
    margin-bottom: 0;
  }

  .toggle-mode-btn {
    background: none;
    border: none;
    color: #38bdf8;
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    margin-left: 4px;
    transition: color 0.2s;
  }

  .toggle-mode-btn:hover {
    color: #1d6ce3;
    text-decoration: underline;
  }

  /* SEPARADOR Y GOOGLE OAUTH */
  .google-divider {
    margin-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .divider-text {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  #google-signin-btn {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  /* RETORNO AL INICIO */
  .back-home-wrapper {
    margin-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 16px;
    text-align: center;
  }

  .back-home-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #94a3b8;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 500;
    transition: color 0.2s, transform 0.2s;
  }

  .back-home-link:hover {
    color: #38bdf8;
    transform: translateX(-2px);
  }

  /* ALERTAS DE ESTADO */
  .status-alert {
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    line-height: 1.4;
    text-align: left;
  }

  .status-alert.success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #34d399;
  }

  .status-alert.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #f87171;
  }

  @media (max-width: 480px) {
    .glass-card {
      padding: 30px 20px;
    }
  }
</style>
