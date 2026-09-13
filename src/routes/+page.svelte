<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import RepField from '$lib/components/RepField.svelte';
	import { MAX_REPS, SESSION_DURATION_MS } from '$lib/constants';
	import { createSession, listSessions, type Session } from '$lib/db/sessions';
	import { formatRepLength, formatWhen } from '$lib/format';
	import { onMount } from 'svelte';

	let planned = $state<number | null>(null);
	let submitting = $state(false);
	let formError = $state<string | null>(null);
	let open = $state<Session[]>([]);
	let recent = $state<Session[]>([]);

	async function refresh() {
		const lists = await listSessions();
		open = lists.open;
		recent = lists.recent;
	}

	onMount(() => {
		void refresh().catch((cause: unknown) => {
			formError = cause instanceof Error ? cause.message : String(cause);
		});
	});

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = null;
		if (planned == null) {
			formError = 'Enter how many reps you plan to perform.';
			return;
		}
		submitting = true;
		try {
			const session = await createSession(planned);
			await goto(resolve('/session/[id]', { id: session.id }));
		} catch (cause) {
			formError = cause instanceof Error ? cause.message : String(cause);
			submitting = false;
		}
	}
</script>

<main class="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-16 pb-10">
	<header class="mb-12 text-center">
		<p class="text-xs font-semibold tracking-[0.32em] text-amber-400 uppercase">Twenty</p>
		<h1 class="mt-2 text-5xl font-semibold tracking-tight">Minutes</h1>
		<p class="mt-4 text-sm text-stone-400">
			One session. Twenty minutes. Split evenly across the reps you plan.
		</p>
	</header>

	<form class="flex flex-col gap-6" onsubmit={onSubmit}>
		<RepField
			bind:value={planned}
			label="Planned reps"
			hint="Press enter to create a session"
			min={1}
			max={MAX_REPS}
			autofocus
		/>
		<button
			class="h-14 rounded-2xl bg-amber-400 text-base font-semibold text-stone-950 disabled:opacity-50"
			type="submit"
			disabled={submitting}
		>
			{submitting ? 'Creating…' : 'Create session'}
		</button>
		{#if formError}
			<p class="text-center text-sm text-red-400">{formError}</p>
		{/if}
	</form>

	{#if open.length > 0}
		<section class="mt-12">
			<h2 class="text-xs font-semibold tracking-[0.22em] text-stone-500 uppercase">Open</h2>
			<ul class="mt-3 flex flex-col gap-2">
				{#each open as session (session.id)}
					<li>
						<a
							class="flex items-center justify-between rounded-2xl border border-stone-800 bg-stone-900/60 px-4 py-3"
							href={resolve('/session/[id]', { id: session.id })}
						>
							<span class="font-medium">
								{session.planned_reps} planned
							</span>
							<span class="text-sm text-amber-400">
								{session.started_at ? 'Resume' : 'Start'}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if recent.length > 0}
		<section class="mt-10">
			<h2 class="text-xs font-semibold tracking-[0.22em] text-stone-500 uppercase">Recent</h2>
			<ul class="mt-3 flex flex-col gap-2">
				{#each recent as session (session.id)}
					<li
						class="flex items-baseline justify-between rounded-2xl border border-stone-800/80 px-4 py-3 text-sm"
					>
						<div>
							<p class="font-medium text-stone-200">
								{session.actual_reps ?? '—'}
								<span class="text-stone-500"> / {session.planned_reps} planned</span>
							</p>
							<p class="mt-1 text-xs text-stone-500">
								{session.completed_at ? formatWhen(session.completed_at) : ''}
							</p>
						</div>
						<p class="font-mono text-xs text-stone-500">
							{formatRepLength(SESSION_DURATION_MS / session.planned_reps)} / rep
						</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>
