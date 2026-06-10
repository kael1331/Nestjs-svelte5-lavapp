<script lang="ts">
	let name = $state("");
	let email = $state("");
	let message = $state("");
	let isSending = $state(false);
	let statusMessage = $state("");
	let statusType: 'success' | 'error' | '' = $state('');

	const WEB3FORMS_ACCESS_KEY = "ecc51a3e-c5a6-4693-a9e8-f3c9f89fee10";

	async function handleContactSubmit(e: SubmitEvent) {
		e.preventDefault();
		isSending = true;
		statusMessage = "";
		statusType = '';

		const formData = new FormData();
		formData.append("access_key", WEB3FORMS_ACCESS_KEY);
		formData.append("name", name);
		formData.append("email", email);
		formData.append("message", message);
		formData.append("subject", "Nuevo contacto desde LavaYa");
		formData.append("from_name", "Contacto LavaYa");
		formData.append("replyto", email);

		try {
			const response = await fetch("https://api.web3forms.com/submit", {
				method: "POST",
				body: formData
			});

			const data = await response.json();

			if (response.ok) {
				statusType = 'success';
				statusMessage = "¡Tu mensaje ha sido enviado con éxito! Nos pondremos en contacto contigo pronto.";
				name = "";
				email = "";
				message = "";
			} else {
				statusType = 'error';
				statusMessage = `Error al enviar: ${data.message || 'Inténtalo de nuevo.'}`;
			}
		} catch (error) {
			statusType = 'error';
			statusMessage = "Ocurrió un problema de red. Por favor, comprueba tu conexión y vuelve a intentarlo.";
		} finally {
			isSending = false;
		}
	}
</script>

<svelte:head>
	<title>LavaYa - Contactarse con nosotros</title>
	<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<main class="contact-container">
	<div class="glass-card">
		<div class="back-link-container">
			<a href="/" class="back-link">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
				Volver al inicio
			</a>
		</div>

		<div class="contact-header">
			<div class="logo-wrapper">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="logo-icon">
					<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="none" stroke="#1d6ce3" stroke-width="2"/>
					<path d="M7 14h10m-10 0a1 1 0 0 0-1 1v2.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V15a1 1 0 0 0-1-1m-9 0V12.5a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5V14" stroke="#ffffff" stroke-width="1.5"/>
					<circle cx="8.5" cy="15.5" r="0.75" fill="#ffffff"/>
					<circle cx="15.5" cy="15.5" r="0.75" fill="#ffffff"/>
				</svg>
				<span class="logo-text">Lava<span class="blue-text">Ya</span></span>
			</div>
			<h1>Contactarse con nosotros</h1>
			<p class="subtitle">Dejanos tu consulta o sugerencia y te responderemos a la brevedad.</p>
		</div>

		<form onsubmit={handleContactSubmit} class="contact-form">
			<div class="form-group">
				<label for="name">Nombre completo</label>
				<input 
					type="text" 
					id="name" 
					bind:value={name} 
					placeholder="Ej. Juan Pérez" 
					required 
				/>
			</div>

			<div class="form-group">
				<label for="email">Correo electrónico</label>
				<input 
					type="email" 
					id="email" 
					bind:value={email} 
					placeholder="Ej. juan.perez@ejemplo.com" 
					required 
				/>
			</div>

			<div class="form-group">
				<label for="message">Mensaje</label>
				<textarea 
					id="message" 
					bind:value={message} 
					placeholder="Escribe aquí tu consulta..." 
					rows="5" 
					required
				></textarea>
			</div>

			<button type="submit" class="submit-btn" disabled={isSending}>
				{#if isSending}
					<span class="spinner"></span> Enviando...
				{:else}
					Enviar mensaje
				{/if}
			</button>
		</form>

		{#if statusMessage}
			<div class="status-alert {statusType}">
				{#if statusType === 'success'}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
				{/if}
				<span>{statusMessage}</span>
			</div>
		{/if}
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

	.contact-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: 40px 20px;
		box-sizing: border-box;
		background-image: radial-gradient(circle at 80% 20%, rgba(29, 108, 227, 0.15) 0%, transparent 50%);
	}

	.glass-card {
		background: rgba(15, 23, 42, 0.6);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 24px;
		padding: 40px;
		max-width: 550px;
		width: 100%;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
		animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes scaleUp {
		from { opacity: 0; transform: scale(0.95); }
		to { opacity: 1; transform: scale(1); }
	}

	.back-link-container {
		margin-bottom: 24px;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: #94a3b8;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		transition: color 0.2s, transform 0.2s;
	}

	.back-link:hover {
		color: #38bdf8;
		transform: translateX(-3px);
	}

	.contact-header {
		text-align: center;
		margin-bottom: 32px;
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
		font-size: 1.5rem;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.03em;
	}

	.blue-text {
		color: #1d6ce3;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 8px 0;
		color: #ffffff;
		letter-spacing: -0.02em;
	}

	.subtitle {
		color: #94a3b8;
		font-size: 0.95rem;
		margin: 0;
		line-height: 1.5;
	}

	.contact-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	label {
		font-size: 0.85rem;
		color: #cbd5e1;
		font-weight: 500;
	}

	input, textarea {
		background: rgba(2, 6, 17, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 12px 16px;
		color: #f8fafc;
		font-size: 0.95rem;
		transition: all 0.2s;
		font-family: inherit;
		width: 100%;
		box-sizing: border-box;
	}

	input:focus, textarea:focus {
		outline: none;
		border-color: #1d6ce3;
		background: rgba(2, 6, 17, 0.6);
		box-shadow: 0 0 0 3px rgba(29, 108, 227, 0.25);
	}

	textarea {
		resize: vertical;
	}

	.submit-btn {
		background: linear-gradient(135deg, #1d6ce3 0%, #1e40af 100%);
		border: none;
		border-radius: 12px;
		padding: 14px;
		color: #ffffff;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;
		transition: all 0.2s;
		box-shadow: 0 4px 12px rgba(29, 108, 227, 0.3);
		margin-top: 10px;
	}

	.submit-btn:hover:not(:disabled) {
		opacity: 0.95;
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(29, 108, 227, 0.4);
	}

	.submit-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.submit-btn:disabled {
		background: #334155;
		color: #64748b;
		cursor: not-allowed;
		box-shadow: none;
	}

	.status-alert {
		margin-top: 24px;
		padding: 14px 16px;
		border-radius: 12px;
		font-size: 0.9rem;
		display: flex;
		align-items: flex-start;
		gap: 12px;
		line-height: 1.4;
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

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #ffffff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@media (max-width: 480px) {
		.glass-card {
			padding: 24px 16px;
		}
	}
</style>
