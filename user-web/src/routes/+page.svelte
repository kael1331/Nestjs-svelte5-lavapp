<script lang="ts">
	import backgroundImage from '$lib/assets/Background.png';
	import { authStore } from '$lib/features/auth/services/auth-store.svelte';

	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}
</script>

<svelte:head>
	<title>LavaYa - Tu auto limpio, fácil y rápido</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<main class="home-container" style="background-image: linear-gradient(to right, rgba(4, 6, 12, 0.95) 0%, rgba(4, 6, 12, 0.85) 40%, rgba(4, 6, 12, 0.15) 75%, rgba(4, 6, 12, 0.8) 100%), url({backgroundImage});">
	<!-- NAVBAR -->
	<header class="navbar">
		<div class="logo-wrapper">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="logo-icon">
				<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="none" stroke="#1d6ce3" stroke-width="2.2"/>
				<path d="M7 14h10m-10 0a1 1 0 0 0-1 1v2.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V15a1 1 0 0 0-1-1m-9 0V12.5a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5V14" stroke="#ffffff" stroke-width="1.8"/>
				<circle cx="8.5" cy="15.5" r="0.75" fill="#ffffff"/>
				<circle cx="15.5" cy="15.5" r="0.75" fill="#ffffff"/>
			</svg>
			<span class="logo-text">Lava<span class="blue-text">Ya</span></span>
		</div>

		<div class="nav-actions">
			{#if authStore.loading}
				<span class="loading-state">Cargando...</span>
			{:else if authStore.user}
				<a href="/dashboard/{authStore.user.role.replace('_', '-')}" class="login-btn">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="user-icon">
						<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
					Mi Cuenta
				</a>
			{:else}
				<a href="/login" class="login-btn">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="user-icon">
						<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
					Iniciar sesión
				</a>
			{/if}

			<button class="hamburger-btn" onclick={toggleMenu} aria-label="Abrir menú">
				<span class="bar"></span>
				<span class="bar"></span>
				<span class="bar"></span>
			</button>
		</div>
	</header>

	<!-- SIDEBAR & OVERLAY -->
	<button 
		class="sidebar-overlay" 
		class:active={isMenuOpen} 
		onclick={toggleMenu} 
		aria-label="Cerrar menú"
	></button>

	<div class="sidebar" class:open={isMenuOpen}>
		<div class="sidebar-header">
			<div class="logo-wrapper">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="logo-icon">
					<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="none" stroke="#1d6ce3" stroke-width="2.2"/>
					<path d="M7 14h10m-10 0a1 1 0 0 0-1 1v2.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V15a1 1 0 0 0-1-1m-9 0V12.5a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5V14" stroke="#ffffff" stroke-width="1.8"/>
					<circle cx="8.5" cy="15.5" r="0.75" fill="#ffffff"/>
					<circle cx="15.5" cy="15.5" r="0.75" fill="#ffffff"/>
				</svg>
				<span class="logo-text">Lava<span class="blue-text">Ya</span></span>
			</div>
			<button class="close-btn" onclick={toggleMenu} aria-label="Cerrar menú">✕</button>
		</div>

		<nav class="sidebar-nav">
			<a href="/" onclick={toggleMenu} class="nav-link active">Inicio</a>
			<a href="/contactarse-con-nosotros" onclick={toggleMenu} class="nav-link">Contactarse con nosotros</a>
			<a href="/sandbox" onclick={toggleMenu} class="nav-link">Sandbox de Pruebas</a>
			
			<hr class="nav-divider">

			{#if authStore.user}
				<div class="user-sidebar-info">
					<span class="user-name">Hola, {authStore.user.name}</span>
					<span class="user-role">{authStore.user.role}</span>
				</div>
				<a href="/dashboard/{authStore.user.role.replace('_', '-')}" onclick={toggleMenu} class="sidebar-dashboard-btn">
					Ir al Dashboard
				</a>
				<button onclick={() => { authStore.logout(); toggleMenu(); }} class="sidebar-logout-btn">
					Cerrar sesión
				</button>
			{:else}
				<a href="/login" onclick={toggleMenu} class="sidebar-login-btn">
					Iniciar sesión
				</a>
			{/if}
		</nav>
	</div>

	<!-- HERO SECTION (Diseño sin scroll en viewport 100vh) -->
	<section class="hero">
		<div class="hero-content">
			<h1 class="hero-title">
				Tu auto limpio,<br>
				<span class="blue-text">fácil y rápido</span>
			</h1>
			<p class="hero-subtitle">
				Encontrá lavaderos cercanos, consultá disponibilidad,<br>
				reservá tu turno y pagá todo desde la app.
			</p>

			<!-- FEATURES GRID -->
			<div class="features-grid">
				<div class="feature-item">
					<div class="feature-icon-wrapper">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d6ce3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
							<circle cx="12" cy="10" r="3"/>
						</svg>
					</div>
					<div class="feature-text">
						<span class="feature-title">Encontrá</span>
						<span class="feature-desc">lavaderos cercanos</span>
					</div>
				</div>

				<div class="feature-item">
					<div class="feature-icon-wrapper">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d6ce3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
							<line x1="16" x2="16" y1="2" y2="6"/>
							<line x1="8" x2="8" y1="2" y2="6"/>
							<line x1="3" x2="21" y1="10" y2="10"/>
						</svg>
					</div>
					<div class="feature-text">
						<span class="feature-title">Reservá</span>
						<span class="feature-desc">tu turno</span>
					</div>
				</div>

				<div class="feature-item">
					<div class="feature-icon-wrapper">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d6ce3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect width="20" height="14" x="2" y="5" rx="2"/>
							<line x1="2" x2="22" y1="10" y2="10"/>
						</svg>
					</div>
					<div class="feature-text">
						<span class="feature-title">Pagá</span>
						<span class="feature-desc">de forma segura</span>
					</div>
				</div>

				<div class="feature-item">
					<div class="feature-icon-wrapper">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d6ce3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
						</svg>
					</div>
					<div class="feature-text">
						<span class="feature-title">Disfrutá</span>
						<span class="feature-desc">tu tiempo</span>
					</div>
				</div>
			</div>

			<!-- CTA BUTTON -->
			<div class="cta-wrapper">
				<button class="cta-btn">
					Ver lavaderos cercanos
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="arrow-icon">
						<line x1="5" x2="19" y1="12" y2="12"/>
						<polyline points="12 5 19 12 12 19"/>
					</svg>
				</button>
			</div>
		</div>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #04060c;
		font-family: 'Outfit', sans-serif;
		color: #ffffff;
		height: 100vh;
		overflow: hidden;
	}

	.home-container {
		height: 100vh;
		width: 100%;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		position: relative;
		overflow: hidden;
	}

	/* NAVBAR */
	.navbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 80px;
		padding: 0 5%;
		position: relative;
		z-index: 10;
		box-sizing: border-box;
	}

	.logo-wrapper {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.logo-icon {
		width: 32px;
		height: 32px;
	}

	.logo-text {
		font-size: 1.65rem;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.04em;
	}

	.blue-text {
		color: #1d6ce3;
	}

	.nav-actions {
		display: flex;
		align-items: center;
		gap: 18px;
	}

	.loading-state {
		font-size: 0.85rem;
		color: #94a3b8;
	}

	.login-btn {
		background-color: #1d6ce3;
		color: #ffffff;
		border: none;
		border-radius: 50px;
		padding: 8px 18px;
		font-size: 0.9rem;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4px 12px rgba(29, 108, 227, 0.25);
	}

	.login-btn:hover {
		background-color: #175bb8;
		transform: translateY(-1px);
		box-shadow: 0 6px 18px rgba(29, 108, 227, 0.4);
	}

	.hamburger-btn {
		background: transparent;
		border: none;
		display: flex;
		flex-direction: column;
		gap: 5px;
		cursor: pointer;
		padding: 6px;
		z-index: 11;
	}

	.bar {
		width: 24px;
		height: 2px;
		background-color: #ffffff;
		border-radius: 4px;
		transition: all 0.2s;
	}

	/* SIDEBAR OVERLAY */
	.sidebar-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: none;
		z-index: 9998;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s ease;
	}

	.sidebar-overlay.active {
		opacity: 1;
		pointer-events: auto;
	}

	/* SIDEBAR */
	.sidebar {
		position: fixed;
		top: 0;
		right: -320px;
		width: 320px;
		height: 100vh;
		background: rgba(4, 6, 12, 0.92);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border-left: 1px solid rgba(255, 255, 255, 0.08);
		z-index: 9999;
		padding: 32px 24px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
	}

	.sidebar.open {
		right: 0;
	}

	.sidebar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 40px;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: #94a3b8;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 4px;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #ffffff;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.nav-link {
		color: #94a3b8;
		text-decoration: none;
		font-size: 1.1rem;
		font-weight: 500;
		padding: 10px 14px;
		border-radius: 10px;
		transition: all 0.2s;
	}

	.nav-link:hover, .nav-link.active {
		color: #ffffff;
		background: rgba(255, 255, 255, 0.05);
	}

	.nav-divider {
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		margin: 16px 0;
	}

	.user-sidebar-info {
		padding: 0 14px;
		display: flex;
		flex-direction: column;
		margin-bottom: 16px;
	}

	.user-name {
		font-weight: 600;
		color: #f8fafc;
	}

	.user-role {
		font-size: 0.8rem;
		color: #38bdf8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: 2px;
	}

	.sidebar-dashboard-btn {
		background: rgba(29, 108, 227, 0.1);
		color: #38bdf8;
		border: 1px solid rgba(29, 108, 227, 0.2);
		border-radius: 12px;
		padding: 12px;
		text-align: center;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
		margin-bottom: 12px;
	}

	.sidebar-dashboard-btn:hover {
		background: rgba(29, 108, 227, 0.2);
		color: #ffffff;
	}

	.sidebar-logout-btn {
		background: rgba(239, 68, 68, 0.1);
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 12px;
		padding: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.sidebar-logout-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		color: #ffffff;
	}

	.sidebar-login-btn {
		background: #1d6ce3;
		color: #ffffff;
		border-radius: 12px;
		padding: 14px;
		text-align: center;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.2s;
	}

	.sidebar-login-btn:hover {
		background: #175bb8;
	}

	/* HERO */
	.hero {
		flex: 1;
		display: flex;
		align-items: flex-start;
		padding: 30px 5% 0 5%;
		box-sizing: border-box;
		overflow: hidden;
	}

	.hero-content {
		max-width: 65%;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.hero-title {
		font-size: 4rem;
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.04em;
		margin: 0 0 16px 0;
		animation: fadeInUp 0.5s ease-out;
	}

	.hero-subtitle {
		font-size: 1.15rem;
		font-weight: 300;
		color: #cbd5e1;
		line-height: 1.5;
		margin: 0 0 32px 0;
		animation: fadeInUp 0.6s ease-out;
	}

	/* FEATURES GRID */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(4, auto);
		justify-content: start;
		gap: 36px;
		margin-bottom: 36px;
		animation: fadeInUp 0.7s ease-out;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.feature-icon-wrapper {
		background: rgba(29, 108, 227, 0.1);
		border: 1px solid rgba(29, 108, 227, 0.15);
		border-radius: 10px;
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.feature-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.feature-title {
		font-weight: 600;
		font-size: 0.95rem;
		color: #ffffff;
	}

	.feature-desc {
		font-size: 0.8rem;
		color: #94a3b8;
		white-space: nowrap;
	}

	/* CTA BUTTON */
	.cta-wrapper {
		animation: fadeInUp 0.8s ease-out;
	}

	.cta-btn {
		background-color: #1d6ce3;
		color: #ffffff;
		border: none;
		border-radius: 12px;
		padding: 14px 24px;
		font-size: 0.95rem;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4px 14px rgba(29, 108, 227, 0.3);
	}

	.cta-btn:hover {
		background-color: #175bb8;
		transform: translateY(-1px) scale(1.01);
		box-shadow: 0 6px 18px rgba(29, 108, 227, 0.4);
	}

	.cta-btn:active {
		transform: translateY(0) scale(1);
	}

	.arrow-icon {
		transition: transform 0.2s ease;
	}

	.cta-btn:hover .arrow-icon {
		transform: translateX(3px);
	}

	/* ANIMATIONS */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(15px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* RESPONSIVE DESIGN */
	@media (max-width: 1024px) {
		.hero-content {
			max-width: 80%;
		}

		.hero-title {
			font-size: 3.2rem;
		}

		.features-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 24px;
		}
	}

	@media (max-width: 768px) {
		:global(body) {
			overflow-y: auto; /* Permite scroll solo en pantallas muy pequeñas */
			height: auto;
		}
		
		.home-container {
			height: auto;
			min-height: 100vh;
			overflow-y: auto;
		}

		.hero {
			padding: 40px 6%;
			height: auto;
		}

		.hero-content {
			max-width: 100%;
			padding-bottom: 20px;
		}

		.features-grid {
			grid-template-columns: 1fr;
			gap: 16px;
		}
	}

	@media (max-height: 600px) {
		.hero-title {
			font-size: 2.2rem;
			margin-bottom: 8px;
		}
		.hero-subtitle {
			margin-bottom: 16px;
			font-size: 0.95rem;
		}
		.features-grid {
			margin-bottom: 20px;
			gap: 16px;
		}
		.cta-btn {
			padding: 10px 20px;
		}
	}
</style>
