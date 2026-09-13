<script lang="ts">
	let {
		progress,
		size = 280,
		stroke = 10,
		track = '#2a2824',
		fill = '#e8a317'
	}: {
		progress: number;
		size?: number;
		stroke?: number;
		track?: string;
		fill?: string;
	} = $props();

	const radius = $derived((size - stroke) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const offset = $derived(circumference * (1 - Math.min(1, Math.max(0, progress))));
</script>

<svg class="block" width={size} height={size} viewBox="0 0 {size} {size}" aria-hidden="true">
	<circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} stroke-width={stroke} />
	<circle
		cx={size / 2}
		cy={size / 2}
		r={radius}
		fill="none"
		stroke={fill}
		stroke-width={stroke}
		stroke-linecap="butt"
		stroke-dasharray={circumference}
		stroke-dashoffset={offset}
		transform="rotate(-90 {size / 2} {size / 2})"
	/>
</svg>
