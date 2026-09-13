<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<main class="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
	<p class="text-xs font-semibold tracking-[0.28em] text-amber-400 uppercase">20 Minutes</p>
	<h1 class="mt-4 text-2xl font-semibold">{page.status}</h1>
	<p class="mt-3 text-sm text-stone-400">{page.error?.message ?? 'Something went wrong.'}</p>
	<a class="mt-8 text-amber-400" href={resolve('/')}>Home</a>
</main>
