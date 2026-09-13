import { browser } from '$app/environment';
import { DB_NAME } from '$lib/constants';
import type { PGlite } from '@electric-sql/pglite';

const SCHEMA = `
	CREATE TABLE IF NOT EXISTS sessions (
		id TEXT PRIMARY KEY,
		planned_reps INTEGER NOT NULL
			CHECK (planned_reps > 0 AND planned_reps <= 1200),
		actual_reps INTEGER
			CHECK (actual_reps IS NULL OR actual_reps >= 0),
		started_at TIMESTAMPTZ,
		completed_at TIMESTAMPTZ,
		created_at TIMESTAMPTZ NOT NULL DEFAULT now()
	);

	CREATE INDEX IF NOT EXISTS sessions_open_idx
		ON sessions (created_at DESC)
		WHERE completed_at IS NULL;

	CREATE INDEX IF NOT EXISTS sessions_completed_idx
		ON sessions (completed_at DESC)
		WHERE completed_at IS NOT NULL;
`;

let dbPromise: Promise<PGlite> | null = null;

async function initDb(): Promise<PGlite> {
	const { PGlite } = await import('@electric-sql/pglite');
	const db = await PGlite.create(DB_NAME, { relaxedDurability: true });
	await db.exec(SCHEMA);
	if (import.meta.env.DEV) {
		(globalThis as unknown as { __twentyMinutesDb?: PGlite }).__twentyMinutesDb = db;
	}
	return db;
}

/** Singleton PGlite client persisted to IndexedDB. Browser-only. */
export function getDb(): Promise<PGlite> {
	if (!browser) {
		return Promise.reject(new Error('PGlite runs in the browser only'));
	}
	if (!dbPromise) {
		dbPromise = initDb();
	}
	return dbPromise;
}
