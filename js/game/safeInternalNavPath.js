/** Used when assigning `location` from sessionStorage (React bridge); blocks protocol-relative and absolute URLs. */
export function isSafeInternalAssignPath(s) {
    if (typeof s !== "string" || s.length === 0 || s[0] !== "/") return false;
    if (s.startsWith("//") || s.includes("://")) return false;
    if (s.includes("\\")) return false;
    return true;
}
