import { z } from 'zod';

export const zLogSchema = z.object({
    containerId: z.string(),
    timestamp: z.string(),
    message: z.string(),
    uniqueId: z.string(),
    logLevel: z.string()
});

export const zLogsResponseSchema = z.object({
    logs: z.array(zLogSchema),
    totalCount: z.number(),
    page: z.number(),
    totalPages: z.number(),
    pageSize: z.number(),
});

export type Log = z.infer<typeof zLogSchema>;