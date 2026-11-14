import type { Context } from "hono";
import { z } from "zod";

type AppContext = Context<{ Bindings: Env }>;

const MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
const EXPLAIN_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_HOSTS = [".asf.alaska.edu", ".earthdatacloud.nasa.gov", ".earthdata.nasa.gov"];

const sceneSchema = z.object({
	id: z.string().regex(/^[A-Za-z0-9_.-]{1,80}$/),
	date: z.iso.date(),
	imageUrl: z.url({ protocol: /^https$/ }),
});

const bodySchema = z.object({
	place: z.string().min(1).max(120),
	theme: z.string().max(200).optional(),
	layer: z.string().max(60).default("Geographic quicklook"),
	before: sceneSchema,
	after: sceneSchema,
});

function isAllowedImageUrl(value: string): boolean {
	const { hostname } = new URL(value);
	return ALLOWED_IMAGE_HOSTS.some((suffix) => hostname.endsWith(suffix));
}

function toBase64(bytes: Uint8Array): string {
	let binary = "";
	const chunk = 0x8000;
	for (let index = 0; index < bytes.length; index += chunk) {
		binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
	}
	return btoa(binary);
}

async function fetchAsDataUrl(url: string): Promise<string> {
	const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
	if (!response.ok) throw new Error(`Image request failed (${response.status}).`);
	const type = response.headers.get("content-type") ?? "";
	if (!type.startsWith("image/")) throw new Error("Browse link did not return an image.");
	const buffer = await response.arrayBuffer();
	if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error("Browse image is too large to analyze.");
	return `data:${type.split(";")[0]};base64,${toBase64(new Uint8Array(buffer))}`;
}

function buildPrompt(input: z.infer<typeof bodySchema>): string {
	const { place, theme, layer, before, after } = input;
	return [
		"You are helping a student read two NISAR L-band radar browse images (quicklooks).",
		`Place: ${place}.${theme ? ` Context: ${theme}.` : ""}`,
		`Image 1 is the EARLIER pass (${before.date}). Image 2 is the LATER pass (${after.date}). Layer: ${layer}.`,
		"Bright pixels mean strong radar backscatter (rough, structured, or very wet surfaces, buildings, tree trunks); dark pixels mean weak backscatter (smooth surfaces such as calm open water).",
		"These are provisional, uncalibrated browse images, so differences can also come from viewing geometry, soil moisture, or processing, not only real change.",
		"Write under 130 words in plain language, in exactly three short parts labeled:",
		"What differs: visible differences between the two images, or say there is no obvious difference.",
		"Possible drivers: one or two physical hypotheses worded as possibilities (for example flooding, vegetation or soil moisture, ice or snow, land movement).",
		"Caveat: one sentence on why this is not a measurement.",
		"Do not invent numbers or place names you cannot see.",
	].join("\n");
}

export async function explainChange(c: AppContext) {
	let json: unknown;
	try {
		json = await c.req.json();
	} catch {
		return c.json({ error: "Send a JSON body." }, 400);
	}
	const parsed = bodySchema.safeParse(json);
	if (!parsed.success) {
		return c.json({ error: "Provide a place and two passes with browse images." }, 400);
	}
	const input = parsed.data;
	if (!isAllowedImageUrl(input.before.imageUrl) || !isAllowedImageUrl(input.after.imageUrl)) {
		return c.json({ error: "Browse images must come from NASA or ASF hosts." }, 400);
	}
	if (!c.env.AI) {
		return c.json({ error: "The AI binding is not configured." }, 503);
	}

	const cacheKey = `explain:v1:${input.before.id}:${input.after.id}:${input.layer}`;
	try {
		const cached = await c.env.CACHE?.get(cacheKey, "json");
		if (cached) {
			return c.json({ ...(cached as object), cached: true });
		}
	} catch (error) {
		console.error("Explanation cache read failed", error);
	}

	let images: [string, string];
	try {
		images = await Promise.all([
			fetchAsDataUrl(input.before.imageUrl),
			fetchAsDataUrl(input.after.imageUrl),
		]);
	} catch (error) {
		console.error("Browse image fetch failed", error);
		return c.json({ error: "Could not load the browse images for analysis." }, 502);
	}

	let text: string;
	try {
		const result = (await c.env.AI.run(MODEL as keyof AiModels, {
			messages: [
				{
					role: "user",
					content: [
						{ type: "text", text: buildPrompt(input) },
						{ type: "image_url", image_url: { url: images[0] } },
						{ type: "image_url", image_url: { url: images[1] } },
					],
				},
			],
			max_tokens: 350,
		} as never)) as { response?: string } | string;
		text = (typeof result === "string" ? result : result.response ?? "").trim();
	} catch (error) {
		console.error("Workers AI request failed", error);
		return c.json({ error: "The AI reader is unavailable right now. Try again shortly." }, 502);
	}
	if (!text) {
		return c.json({ error: "The AI reader returned no text." }, 502);
	}

	const payload = { text, model: MODEL };
	try {
		await c.env.CACHE?.put(cacheKey, JSON.stringify(payload), {
			expirationTtl: EXPLAIN_CACHE_TTL_SECONDS,
		});
	} catch (error) {
		console.error("Explanation cache write failed", error);
	}
	return c.json({ ...payload, cached: false });
}
