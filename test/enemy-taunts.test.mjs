import { test } from "node:test";
import assert from "node:assert/strict";
import { pickEnemyTaunt, computeRespectScore, toneGuidanceForRespect } from "../js/enemyTaunts.js";
import { weaponDamageMultiplier, buildHeroWeaponOverlay } from "../js/cosmeticEvolution.js";

test("pickEnemyTaunt returns strings", () => {
    const a = pickEnemyTaunt({ level: 1, cosmeticsTier: 0, turnIndex: 0, bossName: "Slime" });
    const b = pickEnemyTaunt({ level: 12, cosmeticsTier: 5, turnIndex: 3, bossName: "Titan" });
    assert.equal(typeof a, "string");
    assert.ok(a.length > 5);
    assert.equal(typeof b, "string");
    assert.ok(b.includes("Titan"));
});

test("computeRespectScore and toneGuidanceForRespect align", () => {
    const low = computeRespectScore({ level: 1, cosmeticsTier: 0 });
    const high = computeRespectScore({ level: 20, cosmeticsTier: 5 });
    assert.ok(high >= low);
    assert.ok(toneGuidanceForRespect(low).length > 10);
    assert.ok(toneGuidanceForRespect(high).includes("deferential"));
});

test("weaponDamageMultiplier scales with tier", () => {
    assert.equal(weaponDamageMultiplier(0), 1);
    assert.ok(weaponDamageMultiplier(5) > weaponDamageMultiplier(1));
});

test("buildHeroWeaponOverlay grows with tier", () => {
    assert.equal(buildHeroWeaponOverlay(0), "");
    assert.ok(buildHeroWeaponOverlay(3).includes("HERO_WEAPON_EVOLUTION"));
    assert.ok(buildHeroWeaponOverlay(5).length > buildHeroWeaponOverlay(2).length);
});
