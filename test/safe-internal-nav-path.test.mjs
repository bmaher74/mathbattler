import test from "node:test";
import assert from "node:assert/strict";
import { isSafeInternalAssignPath } from "../js/game/safeInternalNavPath.js";

test("isSafeInternalAssignPath accepts in-app paths", () => {
    assert.equal(isSafeInternalAssignPath("/map"), true);
    assert.equal(isSafeInternalAssignPath("/game?overlay=bestiary"), true);
});

test("isSafeInternalAssignPath rejects open redirects", () => {
    assert.equal(isSafeInternalAssignPath("//evil.com"), false);
    assert.equal(isSafeInternalAssignPath("https://evil.com"), false);
    assert.equal(isSafeInternalAssignPath("relative"), false);
    assert.equal(isSafeInternalAssignPath(""), false);
});
