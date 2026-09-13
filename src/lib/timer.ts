import { SESSION_DURATION_MS } from './constants';

export type TimerState = {
	/** Milliseconds since `startedAt`. */
	elapsedMs: number;
	/** Milliseconds left in the 20-minute session. */
	remainingMs: number;
	/** Milliseconds allocated to each planned rep. */
	repDurationMs: number;
	/** 1-based index of the current rep window. */
	currentRep: number;
	/** Milliseconds left in the current rep window. */
	repRemainingMs: number;
	/** True once elapsed time reaches the session length. */
	finished: boolean;
};

/**
 * Derive the session and per-rep countdowns from a persisted start time.
 *
 * Rep windows are equal slices of the 20-minute session:
 * `repDuration = SESSION_DURATION_MS / plannedReps`.
 * The clock is a pure function of `startedAt` so a refresh or backgrounded
 * tab catches up instead of drifting.
 */
export function getTimerState(
	startedAt: Date,
	plannedReps: number,
	now: Date,
	sessionDurationMs = SESSION_DURATION_MS
): TimerState {
	if (plannedReps < 1) {
		throw new Error('plannedReps must be at least 1');
	}

	const elapsedMs = Math.max(0, now.getTime() - startedAt.getTime());
	const remainingMs = Math.max(0, sessionDurationMs - elapsedMs);
	const finished = remainingMs === 0;
	const repDurationMs = sessionDurationMs / plannedReps;
	const currentIndex = finished
		? plannedReps - 1
		: Math.min(plannedReps - 1, Math.floor(elapsedMs / repDurationMs));
	const repElapsedMs = elapsedMs - currentIndex * repDurationMs;
	const repRemainingMs = finished ? 0 : Math.max(0, repDurationMs - repElapsedMs);

	return {
		elapsedMs,
		remainingMs,
		repDurationMs,
		currentRep: currentIndex + 1,
		repRemainingMs,
		finished
	};
}
