import { z } from "zod";

export const SmokePingSchema = z
    .object({
        ping: z.string().optional(),
        ok: z.boolean().optional()
    })
    .passthrough()
    .refine((d) => d.ping === "ok" || d.ok === true, { message: "Smoke marker missing (need ping ok or ok true)" });
