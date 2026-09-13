import { MAX_REPS } from '$lib/constants';
import { getDb } from './client';

export type Session = {
	id: string;
	planned_reps: number;
	actual_reps: number | null;
	started_at: Date | null;
	completed_at: Date | null;
	created_at: Date;
};

type SessionRow = {
	id: string;
	planned_reps: number;
	actual_reps: number | null;
	started_at: string | Date | null;
	completed_at: string | Date | null;
	created_at: string | Date;
};

function asDate(value: string | Date | null | undefined): Date | null {
	if (value == null) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function mapSession(row: SessionRow): Session {
	const created = asDate(row.created_at);
	if (!created) {
		throw new Error('Session is missing created_at');
	}
	return {
		id: row.id,
		planned_reps: Number(row.planned_reps),
		actual_reps: row.actual_reps == null ? null : Number(row.actual_reps),
		started_at: asDate(row.started_at),
		completed_at: asDate(row.completed_at),
		created_at: created
	};
}

function assertReps(value: number, { allowZero }: { allowZero: boolean }): void {
	const min = allowZero ? 0 : 1;
	if (!Number.isInteger(value) || value < min || value > MAX_REPS) {
		throw new Error(`Reps must be an integer from ${min} to ${MAX_REPS}`);
	}
}

export async function createSession(plannedReps: number): Promise<Session> {
	assertReps(plannedReps, { allowZero: false });
	const db = await getDb();
	const id = crypto.randomUUID();
	const result = await db.query<SessionRow>(
		`INSERT INTO sessions (id, planned_reps) VALUES ($1, $2) RETURNING *`,
		[id, plannedReps]
	);
	return mapSession(result.rows[0]);
}

export async function getSession(id: string): Promise<Session | null> {
	const db = await getDb();
	const result = await db.query<SessionRow>(`SELECT * FROM sessions WHERE id = $1`, [id]);
	return result.rows[0] ? mapSession(result.rows[0]) : null;
}

export async function startSession(id: string): Promise<Session> {
	const db = await getDb();
	const result = await db.query<SessionRow>(
		`UPDATE sessions
		 SET started_at = COALESCE(started_at, now())
		 WHERE id = $1 AND completed_at IS NULL
		 RETURNING *`,
		[id]
	);
	if (!result.rows[0]) {
		throw new Error('Session not found or already completed');
	}
	return mapSession(result.rows[0]);
}

export async function completeSession(id: string, actualReps: number): Promise<Session> {
	assertReps(actualReps, { allowZero: true });
	const db = await getDb();
	const result = await db.query<SessionRow>(
		`UPDATE sessions
		 SET actual_reps = $2, completed_at = now()
		 WHERE id = $1 AND completed_at IS NULL
		 RETURNING *`,
		[id, actualReps]
	);
	if (!result.rows[0]) {
		throw new Error('Session not found or already completed');
	}
	return mapSession(result.rows[0]);
}

export async function abandonSession(id: string): Promise<void> {
	const db = await getDb();
	await db.query(`DELETE FROM sessions WHERE id = $1 AND started_at IS NULL`, [id]);
}

export async function listSessions(): Promise<{ open: Session[]; recent: Session[] }> {
	const db = await getDb();
	const [open, recent] = await Promise.all([
		db.query<SessionRow>(
			`SELECT * FROM sessions
			 WHERE completed_at IS NULL
			 ORDER BY created_at DESC`
		),
		db.query<SessionRow>(
			`SELECT * FROM sessions
			 WHERE completed_at IS NOT NULL
			 ORDER BY completed_at DESC
			 LIMIT 12`
		)
	]);
	return {
		open: open.rows.map(mapSession),
		recent: recent.rows.map(mapSession)
	};
}
