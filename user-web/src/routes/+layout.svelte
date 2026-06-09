<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import ApiConnectionPanel from '$lib/components/test/ApiConnectionPanel.svelte';

	let { children } = $props();

	// Cambia a 'false' si deseas desactivar el selector dinámico de API
	const SHOW_DEBUG_PANEL = true;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

{#if SHOW_DEBUG_PANEL}
	<ApiConnectionPanel />
{/if}
