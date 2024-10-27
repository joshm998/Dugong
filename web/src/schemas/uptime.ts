import { z } from 'zod';

export const zUptimeSchema = z.object({
    healthCheckId: z.number(),
    failedCount: z.number(),
    isLatestFailure: z.boolean()
});

export const zUptimeListSchema = z.array(zUptimeSchema);

export type ContainerSchema = z.infer<typeof zUptimeSchema>;