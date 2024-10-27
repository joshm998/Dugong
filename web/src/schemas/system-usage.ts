import { z } from 'zod';

export const zSystemUsage = z.object({
    cpu: z.object({
        usagePercent: z.number(),
        used: z.number().int(),
        total: z.number().int(),
    }),
    memory: z.object({
        usagePercent: z.number(),
        used: z.number().int(),
        total: z.number().int(),
    }),
    diskIO: z.object({
        readBytes: z.number().int(),
        writeBytes: z.number().int(),
        ioUsage: z.number(),
        ioPercentage: z.number(),
    }),
});

export type SystemUsage = z.infer<typeof zSystemUsage>;