<script lang="ts">
	let {
		value = $bindable(),
		label,
		hint = '',
		min = 1,
		max = 1200,
		autofocus = false,
		id = 'reps'
	}: {
		value: number | null;
		label: string;
		hint?: string;
		min?: number;
		max?: number;
		autofocus?: boolean;
		id?: string;
	} = $props();
</script>

<label class="flex flex-col gap-3" for={id}>
	<span class="text-center text-xs font-semibold tracking-[0.28em] text-stone-400 uppercase">
		{label}
	</span>
	<!-- svelte-ignore a11y_autofocus -->
	<input
		{id}
		{min}
		{max}
		{autofocus}
		class="h-28 w-full rounded-2xl border border-stone-700/80 bg-stone-900/80 text-center font-mono text-6xl font-semibold tracking-tight text-stone-100 tabular-nums caret-amber-400 outline-none focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/30"
		type="number"
		inputmode="numeric"
		step="1"
		required
		autocomplete="off"
		bind:value
	/>
	{#if hint}
		<span class="text-center text-sm text-stone-500">{hint}</span>
	{/if}
</label>
