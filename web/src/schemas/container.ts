import { z } from 'zod';

export const zContainerSchema = z.object({
    id: z.string(),
    names: z.array(z.string()),
    image: z.string(),
    imageId: z.string(),
    command: z.string(),
    createdAt: z.number().int(), // Assuming CreatedAt is an integer timestamp
    labels: z.record(z.string()), // Assuming Labels is a map of string to string
    state: z.string(),
    status: z.string(),
});

export const zContainersSchema = z.array(zContainerSchema);

export type ContainerSchema = z.infer<typeof zContainerSchema>;