#!/usr/bin/env node
// Privacy policy versions for the three Tiny Landlord games (adapted from the
// Mood Dude site's tools/policy.mjs). Each game's policy lives in its own
// folder: index.html is the version in effect, the URL Play Console links;
// <YYYY-MM-DD>.html is each earlier version, named by the date it took
// effect. Old versions are never deleted.
//
//   node tools/policy.mjs list
//   node tools/policy.mjs date <policy> <YYYY-MM-DD>              first publication only
//   node tools/policy.mjs new <policy> <YYYY-MM-DD> "What changed"
//   node tools/policy.mjs check [--draft]
//
// <policy> is classic, tycoon or idle.
//
// `date` gives a policy that was never published its first effective date
// (until then the page says "Not yet published"). Run it when the policy
// URL first goes into Play Console / AdMob.
//
// `new` archives the current version (noindex, no canonical or og:url, an
// "old version" notice), moves index.html to the new date, adds a row on top
// of its "Changes and past versions" table and bumps sitemap.xml. Then edit
// index.html with the new wording.
//
// `check` validates every policy and exits non-zero on any problem; run it
// before every deploy. A policy not yet dated is a problem, except with
// --draft (before launch).
//
// Markers the tool relies on (keep them when editing a policy):
//   <time class="effective" datetime="YYYY-MM-DD">Effective D Month YYYY</time>
//     (datetime="draft" before the first publication)
//   <tbody data-versions> with one <tr data-current> row

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITEMAP = join(ROOT, "sitemap.xml");
const POLICIES = {
	classic: { dir: "privacy", url: "/privacy/" },
	tycoon: { dir: "tycoon/privacy", url: "/tycoon/privacy/" },
	idle: { dir: "idle/privacy", url: "/idle/privacy/" },
};
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const EFFECTIVE = /<time class="effective" datetime="(\d{4}-\d{2}-\d{2}|draft)">[^<]+<\/time>/;
const DRAFT_ROW = "Not yet published (this version)";

const read = (p) => readFileSync(p, "utf8");
const human = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const dayBefore = (iso) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const plural = (n) => `${n} version${n === 1 ? "" : "s"}`;
const timeTag = (iso) => `<time class="effective" datetime="${iso}">Effective ${human(iso)}</time>`;

function fail(msg) { console.error(`error: ${msg}`); process.exit(1); }

function policy(key) {
	const p = POLICIES[key];
	if (!p) fail(`unknown policy "${key}" (policies: ${Object.keys(POLICIES).join(", ")})`);
	return { ...p, key, index: join(ROOT, p.dir, "index.html"), rel: (f) => `${p.dir}/${f}` };
}

function archives(p) {
	return readdirSync(join(ROOT, p.dir)).filter((f) => f.endsWith(".html") && DATE.test(f.slice(0, -5))).map((f) => f.slice(0, 10)).sort();
}

function effective(html, file) {
	const m = html.match(EFFECTIVE);
	if (!m) fail(`${file}: no <time class="effective" datetime="YYYY-MM-DD">Effective ...</time> found`);
	return m[1];
}

function validDate(date) {
	if (!DATE.test(date) || isNaN(Date.parse(date))) fail(`${date} is not a YYYY-MM-DD date`);
}

function bumpSitemap(p, date) {
	if (!existsSync(SITEMAP)) return;
	const re = new RegExp(`(<loc>[^<]*${p.url.replace(/\//g, "\\/")}</loc>\\s*<lastmod>)([^<]*)`);
	writeFileSync(SITEMAP, read(SITEMAP).replace(re, (all, head, old) => (old < date ? head + date : all)));
}

function list() {
	for (const key of Object.keys(POLICIES)) {
		const p = policy(key);
		const eff = effective(read(p.index), p.rel("index.html"));
		const past = archives(p);
		console.log(`${key.padEnd(8)} ${p.url.padEnd(17)} ${eff === "draft" ? "not yet published" : `effective ${eff}`}   ${plural(past.length + 1)}${past.length ? `   past: ${past.join(", ")}` : ""}`);
	}
}

function firstDate(key, date) {
	if (!key || !date) fail("usage: node tools/policy.mjs date <policy> <YYYY-MM-DD>");
	validDate(date);
	const p = policy(key);
	let html = read(p.index);
	if (effective(html, p.rel("index.html")) !== "draft") fail(`${p.rel("index.html")} is already published; use "new" for a change`);
	html = html.replace(EFFECTIVE, timeTag(date));
	if (!html.includes(`<tr data-current><td>${DRAFT_ROW}</td>`)) fail(`${p.rel("index.html")}: no "${DRAFT_ROW}" row in the versions table`);
	html = html.replace(`<tr data-current><td>${DRAFT_ROW}</td>`, `<tr data-current><td>${human(date)} (this version)</td>`);
	writeFileSync(p.index, html);
	bumpSitemap(p, date);
	console.log(`${p.rel("index.html")} is now effective ${date} (first version)`);
}

function newVersion(key, date, summary) {
	if (!key || !date || !summary) fail('usage: node tools/policy.mjs new <policy> <YYYY-MM-DD> "What changed"');
	validDate(date);
	const p = policy(key);
	const html = read(p.index);
	const old = effective(html, p.rel("index.html"));
	if (old === "draft") fail(`${p.rel("index.html")} was never published: edit it in place, then "date" it`);
	if (date <= old) fail(`the new date ${date} must be after the current effective date ${old}`);
	const archivePath = join(ROOT, p.dir, `${old}.html`);
	if (existsSync(archivePath)) fail(`${p.rel(old + ".html")} already exists`);

	// 1. The archived copy: not indexed, not canonical, marked as old.
	const archive = html
		.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex">')
		.replace(/\n<link rel="canonical"[^>]*>/, "")
		.replace(/\n<meta property="og:url"[^>]*>/, "")
		.replace(/<title>([^<]*)<\/title>/, `<title>$1 (${human(old)} version)</title>`)
		.replaceAll(' aria-current="page"', "")
		.replace(/(<p class="date"><time class="effective"[^\n]*<\/p>)/,
			`$1\n\t<div class="archived" role="note"><strong>This is an old version of this policy.</strong> It was in effect from ${human(old)} to ${human(dayBefore(date))}. <a href="${p.url}">Read the current policy</a>.</div>`);
	if (!archive.includes('class="archived"')) fail('could not insert the archived notice (is the effective date in <p class="date">?)');
	writeFileSync(archivePath, archive);

	// 2. The current page: new date, and a new row on top of the history.
	let current = html.replace(EFFECTIVE, timeTag(date));
	const row = /<tr data-current><td>[^<]*\(this version\)<\/td>/;
	if (!row.test(current)) fail(`${p.rel("index.html")}: no <tr data-current> row in the versions table`);
	current = current.replace(row, `<tr><td><a href="${p.url}${old}.html">${human(old)}</a></td>`);
	current = current.replace(/(<tbody data-versions>\n?)(\s*)/, `$1$2<tr data-current><td>${human(date)} (this version)</td><td>${escape(summary)}</td></tr>\n$2`);
	writeFileSync(p.index, current);

	// 3. The sitemap: the policy's lastmod. Archives stay out (noindex).
	bumpSitemap(p, date);

	console.log(`archived  ${p.rel(old + ".html")} (in effect ${old} to ${dayBefore(date)})`);
	console.log(`updated   ${p.rel("index.html")}, now effective ${date}, and sitemap.xml`);
	console.log(`\nNow edit ${p.rel("index.html")} with the new wording, then run: node tools/policy.mjs check`);
}

function check(flags) {
	const draftOk = flags.includes("--draft");
	const problems = [];
	const notes = [];
	const sm = existsSync(SITEMAP) ? read(SITEMAP) : null;
	for (const key of Object.keys(POLICIES)) {
		const p = policy(key);
		const html = read(p.index);
		const m = html.match(EFFECTIVE);
		if (!m) { problems.push(`${p.rel("index.html")}: missing <time class="effective">`); continue; }
		const current = m[1];
		const past = archives(p);

		if (/name="robots" content="noindex"/.test(html)) problems.push(`${p.rel("index.html")}: the current version must not be noindex`);
		if (!html.includes(`rel="canonical" href="https://tiny-landlord.com${p.url}"`)) problems.push(`${p.rel("index.html")}: needs its canonical ${p.url} URL`);
		if (html.includes('class="archived"')) problems.push(`${p.rel("index.html")}: the current version carries the archived notice`);
		if ((html.match(/<tr data-current>/g) || []).length !== 1) problems.push(`${p.rel("index.html")}: needs exactly one <tr data-current> row`);
		if (/TODO/.test(html)) problems.push(`${p.rel("index.html")}: still has a TODO`);

		if (current === "draft") {
			if (past.length) problems.push(`${p.rel("index.html")}: has past versions but no effective date`);
			if (!html.includes(`<tr data-current><td>${DRAFT_ROW}</td>`)) problems.push(`${p.rel("index.html")}: the current row should read "${DRAFT_ROW}" until it is dated`);
			(draftOk ? notes : problems).push(`${p.rel("index.html")}: not yet published; date it before its URL goes into Play Console: node tools/policy.mjs date ${key} <YYYY-MM-DD>`);
			continue;
		}

		const cur = html.match(/<tr data-current><td>([^<]*) \(this version\)/);
		if (cur && cur[1] !== human(current)) problems.push(`${p.rel("index.html")}: table says ${cur[1]} but the page is effective ${human(current)}`);

		const linked = [...html.matchAll(new RegExp(`<a href="${p.url.replace(/\//g, "\\/")}(\\d{4}-\\d{2}-\\d{2})\\.html">`, "g"))].map((x) => x[1]);
		for (const d of linked) if (!past.includes(d)) problems.push(`${p.rel("index.html")}: links ${d}.html, which does not exist`);
		for (const d of past) if (!linked.includes(d)) problems.push(`${p.rel("index.html")}: ${d}.html is not listed in the versions table`);

		const dates = [...past, current];
		past.forEach((d, i) => {
			const a = read(join(ROOT, p.dir, `${d}.html`));
			const until = dayBefore(dates[i + 1]);
			if (!/name="robots" content="noindex"/.test(a)) problems.push(`${p.rel(d + ".html")}: missing noindex`);
			if (/rel="canonical"/.test(a)) problems.push(`${p.rel(d + ".html")}: an old version must not be canonical`);
			if (/property="og:url"/.test(a)) problems.push(`${p.rel(d + ".html")}: an old version must not claim og:url`);
			const e = a.match(EFFECTIVE);
			if (!e || e[1] !== d) problems.push(`${p.rel(d + ".html")}: effective date does not match the file name`);
			if (!a.includes(`in effect from ${human(d)} to ${human(until)}`)) problems.push(`${p.rel(d + ".html")}: archived notice should read "in effect from ${human(d)} to ${human(until)}"`);
		});
		if (current <= (past.at(-1) ?? "")) problems.push(`${p.rel("index.html")}: current date ${current} is not after the last archive`);

		if (sm) {
			const lm = sm.match(new RegExp(`<loc>[^<]*${p.url.replace(/\//g, "\\/")}</loc>\\s*<lastmod>([^<]*)`));
			if (!lm) problems.push(`sitemap.xml: no ${p.url} entry`);
			else if (lm[1] < current) problems.push(`sitemap.xml: ${p.url} lastmod ${lm[1]} is before the effective date ${current}`);
			for (const d of past) if (sm.includes(`${p.url}${d}.html`)) problems.push(`sitemap.xml: lists the archived ${p.url}${d}.html (archives are noindex)`);
		}
	}
	for (const n of notes) console.log(`- ${n}`);
	if (problems.length) { for (const x of problems) console.error(`✗ ${x}`); process.exit(1); }
	console.log(`✓ ${Object.keys(POLICIES).length} policies, all versions consistent${notes.length ? ` (${notes.length} not yet published)` : ""}`);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "list") list();
else if (cmd === "date") firstDate(...args);
else if (cmd === "new") newVersion(...args);
else if (cmd === "check") check(args);
else fail('usage: node tools/policy.mjs list | date <policy> <YYYY-MM-DD> | new <policy> <YYYY-MM-DD> "What changed" | check [--draft]');
