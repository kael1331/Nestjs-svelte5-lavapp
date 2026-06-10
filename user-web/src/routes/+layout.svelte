<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import ApiConnectionPanel from '$lib/components/test/ApiConnectionPanel.svelte';
	import Web3FormsTestPanel from '$lib/components/test/Web3FormsTestPanel.svelte';

	let { children } = $props();

	// Cambia a 'false' si deseas desactivar el selector dinámico de API
	const SHOW_DEBUG_PANEL = true;
	// Cambia a 'false' si deseas desactivar el probador de Web3Forms
	const SHOW_WEB3FORMS_PANEL = false;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

{#if SHOW_DEBUG_PANEL}
	<ApiConnectionPanel />
{/if}

{#if SHOW_WEB3FORMS_PANEL}
	<Web3FormsTestPanel />
{/if}
