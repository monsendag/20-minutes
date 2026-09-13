<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import RepField from '$lib/components/RepField.svelte';
	import Ring from '$lib/components/Ring.svelte';
	import { MAX_REPS, SESSION_DURATION_MS } from '$lib/constants';
	import {
		abandonSession,
		completeSession,
		getSession,
		startSession,
		type Session
	} from '$lib/db/sessions';
	import { formatClock, formatRepLength } from '$lib/format';
	import { getTimerState } from '$lib/timer';
	import { attachWakeLock } from '$lib/wake-lock';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	let session = $state<Session | null | undefined>(undefined);
	let now = $state(new Date());
	let endingEarly = $state(false);
	let actual = $state<number | null>(null);
	let busy = $state(false);
	let actionError = $state<string | null>(null);
	let lastRep = 0;
	let announcedFinish = false;

	const timer = $derived(
		session?.started_at ? getTimerState(session.started_at, session.planned_reps, now) : null
	);

	const phase = $derived.by(() => {
		if (session === undefined) return 'loading' as const;
		if (session === null) return 'missing' as const;
		if (session.completed_at) return 'done' as const;
		if (!session.started_at) return 'ready' as const;
		if (endingEarly || timer?.finished) return 'log' as const;
		return 'running' as const;
	});

	$effect(() => {
		const id = params.id;
		let cancelled = false;
		session = undefined;
		endingEarly = false;
		announcedFinish = false;
		lastRep = 0;
		void getSession(id)
			.then((loaded) => {
				if (cancelled) return;
				session = loaded;
				actual = loaded?.actual_reps ?? loaded?.planned_reps ?? null;
			})
			.catch((cause: unknown) => {
				if (cancelled) return;
				session = null;
				actionError = cause instanceof Error ? cause.message : String(cause);
			});
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (phase !== 'running') return;
		untrack(() => {
			now = new Date();
		});
		const interval = setInterval(() => {
			now = new Date();
		}, 100);
		const releaseWakeLock = attachWakeLock();
		return () => {
			clearInterval(interval);
			releaseWakeLock();
		};
	});

	$effect(() => {
		const current = timer?.currentRep ?? 0;
		if (phase === 'running' && lastRep > 0 && current !== lastRep) {
			navigator.vibrate?.([40, 40, 80]);
		}
		if (timer?.finished && !announcedFinish && lastRep > 0) {
			announcedFinish = true;
			navigator.vibrate?.([200, 80, 200]);
		}
		lastRep = current;
	});

	async function onStart() {
		actionError = null;
		busy = true;
		try {
			session = await startSession(params.id);
			now = new Date();
		} catch (cause) {
			actionError = cause instanceof Error ? cause.message : String(cause);
		} finally {
			busy = false;
		}
	}

	async function onAbandon() {
		actionError = null;
		busy = true;
		try {
			await abandonSession(params.id);
			await goto(resolve('/'));
		} catch (cause) {
			actionError = cause instanceof Error ? cause.message : String(cause);
			busy = false;
		}
	}

	async function onSave(event: SubmitEvent) {
		event.preventDefault();
		actionError = null;
		if (actual == null) {
			actionError = 'Enter how many reps you performed.';
			return;
		}
		busy = true;
		try {
			await completeSession(params.id, actual);
			await goto(resolve('/'));
		} catch (cause) {
			actionError = cause instanceof Error ? cause.message : String(cause);
			busy = false;
		}
	}
</script>

{#if phase === 'loading'}
	<main class="mx-auto flex min-h-dvh max-w-md items-center justify-center px-6">
		<p class="text-stone-400">Loading session…</p>
	</main>
{:else if phase === 'missing'}
	<main
		class="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center"
	>
		<h1 class="text-2xl font-semibold">Session not found</h1>
		<p class="mt-3 text-sm text-stone-400">It may have been removed from this device.</p>
		<a class="mt-8 text-amber-400" href={resolve('/')}>Back</a>
	</main>
{:else if phase === 'ready' && session}
	<main class="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-16 pb-10">
		<p class="text-xs font-semibold tracking-[0.28em] text-amber-400 uppercase">Ready</p>
		<h1 class="mt-3 text-4xl font-semibold tracking-tight">
			{session.planned_reps} reps
		</h1>
		<p class="mt-4 text-stone-400">
			{formatRepLength(SESSION_DURATION_MS / session.planned_reps)} per rep, across 20:00.
		</p>
		<button
			class="mt-12 h-16 rounded-2xl bg-amber-400 text-lg font-semibold text-stone-950 disabled:opacity-50"
			type="button"
			onclick={onStart}
			disabled={busy}
		>
			Start
		</button>
		<button
			class="mt-4 h-12 text-sm text-stone-500"
			type="button"
			onclick={onAbandon}
			disabled={busy}
		>
			Cancel
		</button>
		{#if actionError}
			<p class="mt-4 text-center text-sm text-red-400">{actionError}</p>
		{/if}
	</main>
{:else if phase === 'running' && session && timer}
	<main class="mx-auto flex min-h-dvh max-w-lg flex-col items-center px-6 pt-10 pb-8">
		<div class="relative grid place-items-center">
			<Ring progress={timer.elapsedMs / SESSION_DURATION_MS} size={300} stroke={10} />
			<div class="absolute inset-6 grid place-items-center">
				<Ring
					progress={1 - timer.repRemainingMs / timer.repDurationMs}
					size={236}
					stroke={7}
					fill="#f3efe6"
					track="#1c1b19"
				/>
			</div>
			<div class="absolute inset-0 flex flex-col items-center justify-center text-center">
				<p class="text-[0.65rem] font-semibold tracking-[0.28em] text-stone-500 uppercase">
					Session
				</p>
				<p
					class="font-mono text-5xl font-semibold tracking-tight text-stone-100 tabular-nums"
					aria-live="off"
				>
					{formatClock(timer.remainingMs)}
				</p>
			</div>
		</div>

		<div class="mt-10 text-center">
			<p class="text-[0.65rem] font-semibold tracking-[0.28em] text-stone-500 uppercase">
				Current rep
			</p>
			{#key timer.currentRep}
				<p class="rep-pop mt-2 font-mono text-6xl font-semibold tracking-tight tabular-nums">
					{formatClock(timer.repRemainingMs)}
				</p>
			{/key}
			<p class="mt-2 text-lg text-stone-300">
				Rep {timer.currentRep}
				<span class="text-stone-500">of {session.planned_reps}</span>
			</p>
		</div>

		<button
			class="mt-auto pt-10 text-sm text-stone-500"
			type="button"
			onclick={() => {
				endingEarly = true;
				actual = actual ?? session?.planned_reps ?? null;
			}}
		>
			Finish early
		</button>
	</main>
{:else if phase === 'log' && session}
	<main class="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-16 pb-10">
		<p class="text-xs font-semibold tracking-[0.28em] text-amber-400 uppercase">
			{timer?.finished ? 'Done' : 'Ended early'}
		</p>
		<h1 class="mt-3 text-4xl font-semibold tracking-tight">How many reps?</h1>
		<p class="mt-4 text-sm text-stone-400">
			You planned {session.planned_reps}. Log more or fewer if that’s what you actually did.
		</p>

		<form class="mt-10 flex flex-col gap-6" onsubmit={onSave}>
			<RepField bind:value={actual} label="Reps performed" min={0} max={MAX_REPS} autofocus />
			<button
				class="h-14 rounded-2xl bg-amber-400 text-base font-semibold text-stone-950 disabled:opacity-50"
				type="submit"
				disabled={busy}
			>
				{busy ? 'Saving…' : 'Save session'}
			</button>
			{#if timer && !timer.finished}
				<button
					class="h-12 text-sm text-stone-500"
					type="button"
					onclick={() => (endingEarly = false)}
					disabled={busy}
				>
					Back to timer
				</button>
			{/if}
			{#if actionError}
				<p class="text-center text-sm text-red-400">{actionError}</p>
			{/if}
		</form>
	</main>
{:else if phase === 'done' && session}
	<main
		class="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center"
	>
		<p class="text-xs font-semibold tracking-[0.28em] text-amber-400 uppercase">Saved</p>
		<p class="mt-4 text-3xl font-semibold">
			{session.actual_reps} of {session.planned_reps}
		</p>
		<a class="mt-8 text-amber-400" href={resolve('/')}>Home</a>
	</main>
{/if}
