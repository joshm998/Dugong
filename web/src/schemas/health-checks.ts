import { z } from 'zod';

export const zHealthCheckSchema = z.object({
    id: z.number(),
    name: z.string(),
    url: z.string()
});

export const zHealthCheckListSchema = z.array(zHealthCheckSchema);

export type HealthCheck = z.infer<typeof zHealthCheckSchema>;