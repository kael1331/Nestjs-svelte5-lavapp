<script lang="ts">
	let accessKey = $state("ecc51a3e-c5a6-4693-a9e8-f3c9f89fee10");
	let name = $state("");
	let email = $state("");
	let message = $state("");
	
	let isSending = $state(false);
	let responseMessage = $state("");
	let responseStatus: 'success' | 'error' | '' = $state('');
	let isOpen = $state(false); // Panel colapsado por defecto

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		isSending = true;
		responseMessage = "";
		responseStatus = '';

		const formData = new FormData();
		formData.append("access_key", accessKey);
		formData.append("name", name);
		formData.append("email", email);
		formData.append("message", message);

		try {
			const response = await fetch("https://api.web3forms.com/submit", {
				method: "POST",
				body: formData
			});

			const data = await response.json();

			if (response.ok) {
				responseStatus = 'success';
				responseMessage = "¡Mensaje enviado con éxito!";
				// Resetear formulario
				name = "";
				email = "";
				message = "";
			} else {
				responseStatus = 'error';
				responseMessage = `Error: ${data.message || 'No se pudo enviar'}`;
			}
		} catch (error) {
			responseStatus = 'error';
			responseMessage = "Ocurrió un error inesperado al conectar con Web3Forms.";
		} finally {
			isSending = false;
		}
	}
</script>

<div class="web3forms-widget" class:open={isOpen}>
	<button class="toggle-btn" onclick={() => isOpen = !isOpen}>
		{#if isOpen}
			✕ Cerrar Web3Forms
		{:else}
			✉ Probador Web3Forms
		{/if}
	</button>

	{#if isOpen}
		<div class="panel-content">
			<h4>Prueba Web3Forms</h4>
			<p class="description">Envía correos de prueba rápidamente sin usar backend.</p>

			<form onsubmit={handleSubmit}>
				<div class="form-group">
					<label for="w3-key">Clave de Acceso (Access Key):</label>
					<input 
						id="w3-key" 
						type="text" 
						bind:value={accessKey} 
						placeholder="Tu access_key de Web3Forms" 
						required 
					/>
				</div>

				<div class="form-group">
					<label for="w3-name">Nombre:</label>
					<input 
						id="w3-name" 
						type="text" 
						bind:value={name} 
						placeholder="Nombre del remitente" 
						required 
					/>
				</div>

				<div class="form-group">
					<label for="w3-email">Correo Electrónico:</label>
					<input 
						id="w3-email" 
						type="email" 
						bind:value={email} 
						placeholder="correo@ejemplo.com" 
						required 
					/>
				</div>

				<div class="form-group">
					<label for="w3-message">Mensaje:</label>
					<textarea 
						id="w3-message" 
						bind:value={message} 
						placeholder="Escribe tu mensaje aquí..." 
						rows="3" 
						required
					></textarea>
				</div>

				<button type="submit" class="submit-btn" disabled={isSending}>
					{isSending ? "Enviando..." : "Enviar Correo"}
				</button>
			</form>

			{#if responseMessage}
				<div class="response-alert {responseStatus}">
					{responseMessage}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.web3forms-widget {
		position: fixed;
		bottom: 20px;
		left: 20px;
		z-index: 9999;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: rgba(18, 18, 24, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		max-width: 320px;
		width: calc(100vw - 40px);
		overflow: hidden;
	}

	.web3forms-widget.open {
		border-color: rgba(99, 102, 241, 0.4); /* Resplandor Indigo */
		box-shadow: 0 12px 40px rgba(99, 102, 241, 0.2);
	}

	.toggle-btn {
		width: 100%;
		padding: 12px 16px;
		background: transparent;
		border: none;
		color: #e2e8f0;
		font-weight: 600;
		font-size: 0.9rem;
		text-align: left;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: background 0.2s;
	}

	.toggle-btn:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.panel-content {
		padding: 0 16px 16px 16px;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	h4 {
		margin: 12px 0 4px 0;
		color: #f8fafc;
		font-size: 1.05rem;
		font-weight: 600;
	}

	.description {
		font-size: 0.75rem;
		color: #94a3b8;
		margin-bottom: 16px;
		line-height: 1.3;
	}

	.form-group {
		margin-bottom: 12px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	label {
		font-size: 0.7rem;
		color: #94a3b8;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	input, textarea {
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 8px 12px;
		color: #f1f5f9;
		font-size: 0.85rem;
		transition: all 0.2s;
		width: 100%;
		box-sizing: border-box;
	}

	input:focus, textarea:focus {
		outline: none;
		border-color: #6366f1;
		background: rgba(0, 0, 0, 0.5);
		box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	textarea {
		resize: none;
	}

	.submit-btn {
		width: 100%;
		padding: 10px;
		background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
		border: none;
		border-radius: 8px;
		color: white;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
		transition: opacity 0.2s, transform 0.1s;
		margin-top: 8px;
	}

	.submit-btn:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.submit-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.submit-btn:disabled {
		background: #334155;
		color: #64748b;
		cursor: not-allowed;
	}

	.response-alert {
		margin-top: 12px;
		padding: 8px 12px;
		border-radius: 8px;
		font-size: 0.8rem;
		font-weight: 500;
		text-align: center;
	}

	.response-alert.success {
		background: rgba(16, 185, 129, 0.15);
		color: #34d399;
		border: 1px solid rgba(16, 185, 129, 0.2);
	}

	.response-alert.error {
		background: rgba(239, 68, 68, 0.15);
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.2);
	}
</style>
