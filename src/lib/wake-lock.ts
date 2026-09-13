/**
 * Keep the screen awake for the duration of a running session.
 * Re-requests the lock when the tab becomes visible again (browsers drop it
 * on hide). No-ops on browsers that do not implement Wake Lock.
 */
export function attachWakeLock(): () => void {
	let lock: WakeLockSentinel | null = null;

	async function request() {
		try {
			lock = (await navigator.wakeLock?.request('screen')) ?? null;
		} catch {
			lock = null;
		}
	}

	function onVisibility() {
		if (document.visibilityState === 'visible') {
			void request();
		}
	}

	void request();
	document.addEventListener('visibilitychange', onVisibility);

	return () => {
		document.removeEventListener('visibilitychange', onVisibility);
		void lock?.release();
		lock = null;
	};
}
