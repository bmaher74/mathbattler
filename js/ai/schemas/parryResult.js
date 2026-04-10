import { z } from "zod";

export const ParryResultSchema = z.object({
    isParry: z.boolean(),
    note: z.string().optional().default("")
});
