/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `twenty-minutes-${version}`;
const ASSETS = [...build, ...files, ...prerendered];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			await Promise.all(ASSETS.map((asset) => cache.add(asset).catch(() => undefined)));
			await sw.skipWaiting();
		})()
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
			await sw.clients.claim();
		})()
	);
});

sw.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	event.respondWith(respond(request, url));
});

async function respond(request: Request, url: URL): Promise<Response> {
	const cache = await caches.open(CACHE);
	const cached = await cache.match(request);

	if (ASSETS.includes(url.pathname)) {
		return cached ?? fetch(request);
	}

	try {
		const response = await fetch(request);
		if (response.ok && response.type === 'basic') {
			void cache.put(request, response.clone());
		}
		return response;
	} catch {
		if (cached) return cached;
		if (request.mode === 'navigate') {
			const shell = await cache.match('/');
			if (shell) return shell;
		}
		return Response.error();
	}
}
