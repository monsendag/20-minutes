/** Format a millisecond duration as `mm:ss`, rounding up so 0 only means done. */
export function formatClock(ms: number): string {
	const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Human-readable length of a single rep window, e.g. `2:00`. */
export function formatRepLength(ms: number): string {
	if (ms < 1000) {
		return `${Math.round(ms)}ms`;
	}
	const totalSeconds = ms / 1000;
	if (totalSeconds < 60) {
		const rounded = Number.isInteger(totalSeconds)
			? String(totalSeconds)
			: totalSeconds.toFixed(1).replace(/\.0$/, '');
		return `${rounded}s`;
	}
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.round(totalSeconds % 60);
	if (seconds === 60) {
		return `${minutes + 1}:00`;
	}
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatWhen(date: Date): string {
	return date.toLocaleString(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}
