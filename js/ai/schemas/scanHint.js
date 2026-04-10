import { z } from "zod";

export const ScanHintSchema = z.object({
    hint: z.string().min(1)
});
