import { z } from "zod";

export const BossMetaSchema = z.object({
    name: z.string().min(1),
    blurb: z.string().min(1),
    hue: z.string().min(1),
    topic: z.string().min(1)
});
