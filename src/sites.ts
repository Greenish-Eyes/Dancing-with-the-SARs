// Study areas watched by the hourly ingest. Keep in sync with `sites` in public/app.js.
export const SITES = {
	amazon: { name: "Amazon floodplain", bounds: [-61, -4, -59, -2] },
	louisiana: { name: "Mississippi Delta", bounds: [-91, 28, -89, 31] },
	iceland: { name: "South Iceland", bounds: [-20, 63, -18, 65] },
	jakarta: { name: "Jakarta basin", bounds: [106, -7, 108, -5] },
} as const satisfies Record<string, { name: string; bounds: readonly [number, number, number, number] }>;

export type SiteId = keyof typeof SITES;
