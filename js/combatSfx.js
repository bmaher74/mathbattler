/**
 * Procedural combat SFX (Web Audio API) — no asset files.
 * Hero hits scale with cosmetics tier; enemy hits vary by boss identity.
 */

let audioCtx;
let noiseBuffer;

/** 0..1 user SFX level (from profile); updated by applyAudioFromState */
let sfxUserGain = 1;

export function setCombatSfxUserGain(g) {
    sfxUserGain = Math.min(1, Math.max(0, typeof g === "number" ? g : 1));
}

function getCtx() {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
}

function getNoiseBuffer(ctx) {
    if (noiseBuffer) return noiseBuffer;
    const len = Math.floor(ctx.sampleRate * 0.5);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuffer;
}

async function resumeIfNeeded() {
    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();
}

/**
 * Canonical map levels 1..N use one strike palette per slot; higher levels hash off boss name.
 * @param {number} level
 * @param {string} bossName
 * @param {number} canonicalBossCount — e.g. QUEST_ROUTE.length
 */
export function bossStrikeSoundIndex(level, bossName, canonicalBossCount = 10) {
    const lv = Number.isFinite(level) ? Math.floor(level) : 1;
    const n = canonicalBossCount > 0 ? canonicalBossCount : 10;
    if (lv >= 1 && lv <= n) return (lv - 1) % n;
    let h = 2166136261;
    const s = String(bossName || `boss-${lv}`);
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return Math.abs(h) % 16;
}

/**
 * @param {number} tier — hero evolution 0..5
 * @param {{ isCrit?: boolean }} [opts]
 */
export async function playHeroSpellImpact(tier, opts = {}) {
    await resumeIfNeeded();
    const ug = sfxUserGain;
    if (ug <= 0) return;
    const ctx = getCtx();
    const t = Math.min(5, Math.max(0, Math.floor(typeof tier === "number" ? tier : 0)));
    const crit = opts.isCrit === true;
    const now = ctx.currentTime;
    const power = (0.1 + t * 0.045) * ug;
    const bodyDur = 0.07 + t * 0.032;
    const lowEnd = 55 + t * 18;

    const master = ctx.createGain();
    master.gain.value = 0.001;
    master.connect(ctx.destination);

    // Body: downward sine sweep + noise click
    const osc = ctx.createOscillator();
    osc.type = t >= 3 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(520 + t * 90, now);
    osc.frequency.exponentialRampToValueAtTime(lowEnd, now + bodyDur * 0.85);

    const og = ctx.createGain();
    og.gain.setValueAtTime(0.001, now);
    og.gain.linearRampToValueAtTime(power * (crit ? 1.15 : 1), now + 0.012);
    og.gain.exponentialRampToValueAtTime(0.001, now + bodyDur);
    osc.connect(og);
    og.connect(master);

    const ns = ctx.createBufferSource();
    ns.buffer = getNoiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1800 + t * 350, now);
    bp.Q.value = 0.85;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.001, now);
    ng.gain.linearRampToValueAtTime(power * 0.55 * (1 + t * 0.08), now + 0.006);
    ng.gain.exponentialRampToValueAtTime(0.001, now + bodyDur * 0.7);
    ns.connect(bp);
    bp.connect(ng);
    ng.connect(master);

    master.gain.setValueAtTime(0.001, now);
    master.gain.linearRampToValueAtTime((0.85 + t * 0.03) * ug, now + 0.015);
    master.gain.exponentialRampToValueAtTime(0.001, now + bodyDur + 0.05);

    osc.start(now);
    osc.stop(now + bodyDur + 0.02);
    ns.start(now);
    ns.stop(now + bodyDur);

    // Sub thump (tier 2+)
    if (t >= 2) {
        const sub = ctx.createOscillator();
        sub.type = "sine";
        sub.frequency.setValueAtTime(lowEnd * 1.2, now);
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.001, now);
        sg.gain.linearRampToValueAtTime(power * 0.35 * (1 + (t - 2) * 0.12), now + 0.02);
        sg.gain.exponentialRampToValueAtTime(0.001, now + 0.22 + t * 0.03);
        sub.connect(sg);
        sg.connect(master);
        sub.start(now);
        sub.stop(now + 0.35 + t * 0.05);
    }

    // High shimmer (tier 4–5)
    if (t >= 4) {
        const hi = ctx.createOscillator();
        hi.type = "sine";
        hi.frequency.setValueAtTime(1320 + t * 40, now);
        const hg = ctx.createGain();
        hg.gain.setValueAtTime(0.001, now);
        hg.gain.linearRampToValueAtTime(power * 0.2, now + 0.008);
        hg.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        hi.connect(hg);
        hg.connect(master);
        hi.start(now);
        hi.stop(now + 0.12);
    }

    if (crit) {
        const ping = ctx.createOscillator();
        ping.type = "sine";
        ping.frequency.setValueAtTime(880, now);
        ping.frequency.exponentialRampToValueAtTime(1760, now + 0.06);
        const pg = ctx.createGain();
        pg.gain.setValueAtTime(0.001, now);
        pg.gain.linearRampToValueAtTime(power * 0.45, now + 0.004);
        pg.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        ping.connect(pg);
        pg.connect(master);
        ping.start(now + bodyDur * 0.2);
        ping.stop(now + 0.22);
    }
}

/**
 * Distinct enemy counter-attack sounds: 10 canonical archetypes + extra weight/color for hash bucket 10–15.
 * @param {number} kindIndex — from bossStrikeSoundIndex
 */
export async function playEnemyStrike(kindIndex) {
    await resumeIfNeeded();
    const ug = sfxUserGain;
    if (ug <= 0) return;
    const ctx = getCtx();
    const k = ((kindIndex % 16) + 16) % 16;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.001;
    master.connect(ctx.destination);

    const recipes = [
        clawGrowl,
        slimeSplort,
        hissStrike,
        heavySlam,
        crystalPing,
        rotGurgle,
        windLash,
        metalScrape,
        voidDrum,
        snapBite
    ];
    const primary = k % recipes.length;
    const boost = k >= 10 ? 1.12 + (k - 10) * 0.03 : 1;
    recipes[primary](ctx, now, master, 0.24 * boost * ug);
    if (k >= 10) {
        const t2 = now + 0.04;
        hissStrike(ctx, t2, master, 0.09 * boost * ug);
    }
}

function clawGrowl(ctx, now, out, g0) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, now);
    f.frequency.exponentialRampToValueAtTime(220, now + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(g0, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(f);
    f.connect(g);
    g.connect(out);
    osc.start(now);
    osc.stop(now + 0.18);
}

function slimeSplort(ctx, now, out, g0) {
    const ns = ctx.createBufferSource();
    ns.buffer = getNoiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "peaking";
    bp.frequency.value = 450;
    bp.gain.value = 14;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(g0 * 0.9, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    ns.connect(bp);
    bp.connect(g);
    g.connect(out);
    ns.start(now);
    ns.stop(now + 0.2);
}

function hissStrike(ctx, now, out, g0) {
    const ns = ctx.createBufferSource();
    ns.buffer = getNoiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "highpass";
    bp.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(g0 * 0.65, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    ns.connect(bp);
    bp.connect(g);
    g.connect(out);
    ns.start(now);
    ns.stop(now + 0.14);
}

function heavySlam(ctx, now, out, g0) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(70, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(g0, now + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g);
    g.connect(out);
    osc.start(now);
    osc.stop(now + 0.25);
    const ns = ctx.createBufferSource();
    ns.buffer = getNoiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "lowpass";
    bp.frequency.value = 400;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.001, now);
    ng.gain.linearRampToValueAtTime(g0 * 0.4, now + 0.01);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    ns.connect(bp);
    bp.connect(ng);
    ng.connect(out);
    ns.start(now);
    ns.stop(now + 0.1);
}

function crystalPing(ctx, now, out, g0) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(990, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(g0 * 0.7, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(g);
    g.connect(out);
    osc.start(now);
    osc.stop(now + 0.22);
}

function rotGurgle(ctx, now, out, g0) {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(95, now + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(g0 * 0.55, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g);
    g.connect(out);
    osc.start(now);
    osc.stop(now + 0.2);
}

function windLash(ctx, now, out, g0) {
    const ns = ctx.createBufferSource();
    ns.buffer = getNoiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(2000, now);
    bp.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(g0 * 0.5, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    ns.connect(bp);
    bp.connect(g);
    g.connect(out);
    ns.start(now);
    ns.stop(now + 0.15);
}

function metalScrape(ctx, now, out, g0) {
    const ns = ctx.createBufferSource();
    ns.buffer = getNoiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(800, now);
    bp.frequency.linearRampToValueAtTime(2400, now + 0.08);
    bp.Q.value = 2.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(g0 * 0.45, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    ns.connect(bp);
    bp.connect(g);
    g.connect(out);
    ns.start(now);
    ns.stop(now + 0.16);
}

function voidDrum(ctx, now, out, g0) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 52;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(g0 * 1.1, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(g);
    g.connect(out);
    osc.start(now);
    osc.stop(now + 0.4);
}

function snapBite(ctx, now, out, g0) {
    const ns = ctx.createBufferSource();
    ns.buffer = getNoiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1200;
    bp.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(g0 * 0.85, now + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    ns.connect(bp);
    bp.connect(g);
    g.connect(out);
    ns.start(now);
    ns.stop(now + 0.07);
}
