<script lang="ts">
	import backgroundImage from '$lib/assets/Background.png';
	import img1 from '$lib/assets/Primera.png';
	import img2 from '$lib/assets/Segunda.png';
	import img3 from '$lib/assets/tercera.png';
	import img4 from '$lib/assets/Cuarta.png';
	import img5 from '$lib/assets/Quinta.png';
	import { authStore } from '$lib/features/auth/services/auth-store.svelte';

	let isMenuOpen = $state(false);
	let currentSlide = $state(0);

	const carouselImages = [
		{ src: img1, title: 'Reserva tu Turno', desc: 'Elige la fecha y hora que mejor te convenga de forma 100% online.' },
		{ src: img2, title: 'Localiza Lavaderos', desc: 'Encuentra los centros de lavado de autos más cercanos en tiempo real.' },
		{ src: img3, title: 'Pagos Integrados', desc: 'Realiza tus transacciones de forma segura y rápida con tarjeta de crédito o débito.' },
		{ src: img4, title: 'El Mejor Cuidado', desc: 'Contamos con lavaderos asociados calificados para mimar tu vehículo.' },
		{ src: img5, title: 'Disfruta tu Tiempo', desc: 'Deja tu auto en buenas manos y retíralo listo sin demoras ni filas.' }
	];

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function nextSlide() {
		currentSlide = (currentSlide + 1) % carouselImages.length;
	}

	function prevSlide() {
		currentSlide = (currentSlide - 1 + carouselImages.length) % carouselImages.length;
	}
</script>

<svelte:head>
	<title>LavaYa - Tu auto limpio, fácil y rápido</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<main class="home-container">
	<!-- PRIMERA SECCIÓN (Pantalla Completa 100vh) -->
	<div class="hero-section" style="background-image: linear-gradient(to right, rgba(4, 6, 12, 0.95) 0%, rgba(4, 6, 12, 0.85) 40%, rgba(4, 6, 12, 0.15) 75%, rgba(4, 6, 12, 0.8) 100%), url({backgroundImage});">
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

		<!-- HERO SECTION -->
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
	</div>

	<!-- SECCIÓN 2: CARRUSEL DE FUNCIONALIDADES -->
	<section class="carousel-section">
		<div class="section-header">
			<h2>Nuestras Características</h2>
			<p class="section-subtitle">Visualiza la experiencia premium que LavaYa ofrece para el cuidado de tu vehículo.</p>
		</div>

		<div class="carousel-container">
			<button class="carousel-control prev" onclick={prevSlide} aria-label="Diapositiva anterior">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
			</button>
			
			<div class="carousel-track-wrapper">
				<div class="carousel-track" style="transform: translateX(-{currentSlide * 100}%);">
					{#each carouselImages as img, i}
						<div class="carousel-slide">
							<div class="carousel-image-container">
								<img src={img.src} alt={img.title} class="carousel-img" />
								<div class="carousel-overlay"></div>
							</div>
							<div class="carousel-caption">
								<h3>{img.title}</h3>
								<p>{img.desc}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<button class="carousel-control next" onclick={nextSlide} aria-label="Diapositiva siguiente">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
			</button>
		</div>

		<div class="carousel-indicators">
			{#each carouselImages as _, i}
				<button 
					class="indicator-dot" 
					class:active={currentSlide === i} 
					onclick={() => currentSlide = i} 
					aria-label="Ir a diapositiva {i + 1}"
				></button>
			{/each}
		</div>
	</section>

	<!-- SECCIÓN 3: ¿CÓMO FUNCIONA? -->
	<section class="how-it-works-section">
		<div class="section-header">
			<h2>¿Cómo funciona?</h2>
			<p class="section-subtitle">Obtén un auto impecable en cuatro simples pasos sin complicaciones.</p>
		</div>

		<div class="steps-grid">
			<div class="step-card">
				<div class="step-number">01</div>
				<div class="step-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1d6ce3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
				</div>
				<h3>Elegí un lavadero</h3>
				<p>Explorá el mapa y encontrá el lavadero ideal para vos por cercanía y reputación.</p>
			</div>

			<div class="step-card">
				<div class="step-number">02</div>
				<div class="step-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1d6ce3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
				</div>
				<h3>Reservá tu turno</h3>
				<p>Seleccioná el día, la hora y el tipo de lavado que mejor se ajuste a tu agenda.</p>
			</div>

			<div class="step-card">
				<div class="step-number">03</div>
				<div class="step-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1d6ce3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
				</div>
				<h3>Pagá online</h3>
				<p>Aboná de forma rápida y 100% segura utilizando tarjeta de crédito o débito.</p>
			</div>

			<div class="step-card">
				<div class="step-number">04</div>
				<div class="step-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1d6ce3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
				</div>
				<h3>Retirá tu auto</h3>
				<p>Llevá tu vehículo al lavadero y retíralo limpio y brillante sin hacer filas.</p>
			</div>
		</div>
	</section>

	<!-- SECCIÓN 4: FOOTER -->
	<footer class="main-footer">
		<div class="footer-grid">
			<div class="footer-brand">
				<div class="logo-wrapper">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="logo-icon">
						<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="none" stroke="#1d6ce3" stroke-width="2.2"/>
						<path d="M7 14h10m-10 0a1 1 0 0 0-1 1v2.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V15a1 1 0 0 0-1-1m-9 0V12.5a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5V14" stroke="#ffffff" stroke-width="1.8"/>
						<circle cx="8.5" cy="15.5" r="0.75" fill="#ffffff"/>
						<circle cx="15.5" cy="15.5" r="0.75" fill="#ffffff"/>
					</svg>
					<span class="logo-text">Lava<span class="blue-text">Ya</span></span>
				</div>
				<p class="brand-tagline">El cuidado y brillo que tu automóvil merece, al alcance de un clic.</p>
			</div>

			<div class="footer-links">
				<h4>Enlaces rápidos</h4>
				<ul>
					<li><a href="/">Inicio</a></li>
					<li><a href="/contactarse-con-nosotros">Contactarse con nosotros</a></li>
					<li><a href="/sandbox">Sandbox de Pruebas</a></li>
				</ul>
			</div>

			<div class="footer-social">
				<h4>Síguenos</h4>
				<div class="social-icons">
					<a href="https://instagram.com" aria-label="Instagram">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
					</a>
					<a href="https://facebook.com" aria-label="Facebook">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
					</a>
					<a href="https://twitter.com" aria-label="Twitter">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
					</a>
				</div>
			</div>
		</div>
		<div class="footer-bottom">
			<p>&copy; {new Date().getFullYear()} LavaYa. Todos los derechos reservados.</p>
		</div>
	</footer>
</main>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #04060c;
		font-family: 'Outfit', sans-serif;
		color: #ffffff;
		overflow-x: hidden;
		overflow-y: auto;
	}

	.home-container {
		width: 100%;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		position: relative;
		background-color: #04060c;
	}

	/* PRIMERA SECCIÓN (PANTALLA COMPLETA) */
	.hero-section {
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
		align-items: center;
		padding: 0 5%;
		box-sizing: border-box;
		overflow: hidden;
	}

	.hero-content {
		max-width: 65%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 100%;
		padding-bottom: 5vh;
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

	/* SECCIÓN COMÚN: ENCABEZADOS */
	.carousel-section, .how-it-works-section {
		padding: 100px 5%;
		box-sizing: border-box;
		position: relative;
	}

	.section-header {
		text-align: center;
		margin-bottom: 60px;
	}

	.section-header h2 {
		font-size: 2.5rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		margin: 0 0 12px 0;
		background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.section-subtitle {
		font-size: 1.1rem;
		color: #94a3b8;
		font-weight: 300;
		margin: 0;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	/* SECCIÓN 2: CARRUSEL */
	.carousel-section {
		background: radial-gradient(circle at center, #090e1a 0%, #04060c 100%);
		border-top: 1px solid rgba(255, 255, 255, 0.04);
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}

	.carousel-container {
		position: relative;
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20px;
	}

	.carousel-track-wrapper {
		width: 100%;
		border-radius: 20px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(10, 15, 30, 0.4);
		backdrop-filter: blur(12px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
	}

	.carousel-track {
		display: flex;
		transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		width: 100%;
	}

	.carousel-slide {
		min-width: 100%;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.carousel-image-container {
		width: 100%;
		height: 480px;
		overflow: hidden;
		position: relative;
	}

	.carousel-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.carousel-slide:hover .carousel-img {
		transform: scale(1.02);
	}

	.carousel-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(to top, rgba(4, 6, 12, 0.95) 0%, rgba(4, 6, 12, 0.4) 50%, transparent 100%);
		z-index: 1;
	}

	.carousel-caption {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		padding: 32px;
		box-sizing: border-box;
		z-index: 2;
		text-align: left;
	}

	.carousel-caption h3 {
		font-size: 1.8rem;
		font-weight: 700;
		margin: 0 0 8px 0;
		color: #ffffff;
		letter-spacing: -0.02em;
	}

	.carousel-caption p {
		font-size: 1rem;
		color: #cbd5e1;
		margin: 0;
		font-weight: 300;
		line-height: 1.5;
	}

	.carousel-control {
		background: rgba(29, 108, 227, 0.15);
		border: 1px solid rgba(29, 108, 227, 0.25);
		color: #ffffff;
		border-radius: 50%;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
		z-index: 5;
		flex-shrink: 0;
	}

	.carousel-control:hover {
		background: #1d6ce3;
		border-color: #1d6ce3;
		transform: scale(1.1);
		box-shadow: 0 0 16px rgba(29, 108, 227, 0.4);
	}

	.carousel-control:active {
		transform: scale(1);
	}

	.carousel-indicators {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin-top: 30px;
	}

	.indicator-dot {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s;
		padding: 0;
	}

	.indicator-dot.active {
		background: #1d6ce3;
		width: 24px;
		border-radius: 10px;
		box-shadow: 0 0 8px rgba(29, 108, 227, 0.5);
	}

	/* SECCIÓN 3: CÓMO FUNCIONA */
	.how-it-works-section {
		background: #04060c;
	}

	.steps-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 24px;
		max-width: 1100px;
		margin: 0 auto;
	}

	.step-card {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 20px;
		padding: 36px 24px;
		position: relative;
		overflow: hidden;
		box-sizing: border-box;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.step-card:hover {
		transform: translateY(-5px);
		background: rgba(255, 255, 255, 0.04);
		border-color: rgba(29, 108, 227, 0.3);
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
	}

	.step-number {
		position: absolute;
		top: 15px;
		right: 20px;
		font-size: 4.5rem;
		font-weight: 800;
		color: rgba(29, 108, 227, 0.08);
		line-height: 1;
		font-family: inherit;
		transition: color 0.3s;
		user-select: none;
	}

	.step-card:hover .step-number {
		color: rgba(29, 108, 227, 0.15);
	}

	.step-icon {
		background: rgba(29, 108, 227, 0.1);
		border-radius: 12px;
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
	}

	.step-card h3 {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
		color: #ffffff;
		z-index: 2;
	}

	.step-card p {
		font-size: 0.9rem;
		color: #94a3b8;
		line-height: 1.5;
		margin: 0;
		font-weight: 300;
		z-index: 2;
	}

	/* SECCIÓN 4: FOOTER */
	.main-footer {
		background: #020408;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		padding: 80px 5% 30px 5%;
		box-sizing: border-box;
	}

	.footer-grid {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 60px;
		max-width: 1100px;
		margin: 0 auto 50px auto;
	}

	.footer-brand {
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 320px;
	}

	.brand-tagline {
		font-size: 0.95rem;
		color: #94a3b8;
		line-height: 1.5;
		margin: 0;
		font-weight: 300;
	}

	.footer-links h4, .footer-social h4 {
		font-size: 1.1rem;
		font-weight: 700;
		color: #ffffff;
		margin: 0 0 20px 0;
	}

	.footer-links ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.footer-links a {
		color: #94a3b8;
		text-decoration: none;
		font-size: 0.95rem;
		transition: color 0.2s;
	}

	.footer-links a:hover {
		color: #38bdf8;
	}

	.social-icons {
		display: flex;
		gap: 16px;
	}

	.social-icons a {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: #cbd5e1;
		width: 42px;
		height: 42px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.social-icons a:hover {
		background: #1d6ce3;
		border-color: #1d6ce3;
		color: #ffffff;
		transform: translateY(-2px);
	}

	.footer-bottom {
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		padding-top: 30px;
		text-align: center;
		max-width: 1100px;
		margin: 0 auto;
	}

	.footer-bottom p {
		font-size: 0.85rem;
		color: #64748b;
		margin: 0;
	}

	/* ANIMACIONES */
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

		.carousel-image-container {
			height: 380px;
		}

		.steps-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 20px;
		}

		.footer-grid {
			grid-template-columns: 1fr 1fr;
			gap: 40px;
		}

		.footer-brand {
			grid-column: span 2;
			max-width: 100%;
		}
	}

	@media (max-width: 768px) {
		.hero {
			padding: 40px 6%;
			height: auto;
		}

		.hero-section {
			height: auto;
			min-height: 100vh;
			overflow-y: auto;
		}

		.hero-content {
			max-width: 100%;
			padding-bottom: 20px;
		}

		.features-grid {
			grid-template-columns: 1fr;
			gap: 16px;
		}

		.carousel-container {
			gap: 10px;
		}

		.carousel-image-container {
			height: 280px;
		}

		.carousel-caption h3 {
			font-size: 1.4rem;
		}

		.carousel-caption p {
			font-size: 0.85rem;
		}

		.carousel-control {
			width: 38px;
			height: 38px;
		}

		.steps-grid {
			grid-template-columns: 1fr;
		}

		.footer-grid {
			grid-template-columns: 1fr;
		}

		.footer-brand {
			grid-column: span 1;
		}

		.section-header h2 {
			font-size: 2rem;
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
