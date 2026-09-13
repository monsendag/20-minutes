<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { getDb } from '$lib/db/client';
	import { onMount } from 'svelte';

	let { children } = $props();
	let ready = $state(false);
	let error = $state<string | null>(null);

	onMount(() => {
		getDb()
			.then(() => {
				ready = true;
			})
			.catch((cause: unknown) => {
				error = cause instanceof Error ? cause.message : String(cause);
			});
	});
</script>

<svelte:head>
	<title>20 Minutes</title>
	<meta
		name="description"
		content="Plan your reps, run a 20-minute session, and log what you actually did."
	/>
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

{#if error}
	<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
		<p class="text-xs font-semibold tracking-[0.28em] text-amber-400 uppercase">20 Minutes</p>
		<h1 class="mt-4 text-2xl font-semibold">Couldn’t open the local database</h1>
		<p class="mt-3 text-sm text-stone-400">
			This app stores sessions in Postgres-in-the-browser (PGlite) backed by IndexedDB. Check that
			storage isn’t blocked for this site, then reload.
		</p>
		<p class="mt-4 font-mono text-xs break-all text-stone-500">{error}</p>
	</main>
{:else if !ready}
	<main class="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6">
		<p class="text-xs font-semibold tracking-[0.28em] text-amber-400 uppercase">20 Minutes</p>
		<p class="mt-6 text-stone-400">Opening local database…</p>
	</main>
{:else}
	{@render children()}
{/if}
