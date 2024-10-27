import {z} from "zod";

const zStateSchema = z.object({
    status: z.string(),
    running: z.boolean(),
    paused: z.boolean(),
    restarting: z.boolean(),
    oomKilled: z.boolean(),
    dead: z.boolean(),
    pid: z.number(),
    exitCode: z.number(),
    error: z.string(),
    startedAt: z.string().datetime(),
    finishedAt: z.string().datetime(),
});

export type State = z.infer<typeof zStateSchema>;

const zMountSchema = z.object({
    type: z.string(),
    source: z.string(),
    destination: z.string(),
    mode: z.string(),
    rw: z.boolean(),
    propagation: z.string(),
});

const zPortBindingsSchema = z.record(z.array(z.object({
    hostIp: z.string(),
    hostPort: z.string(),
})).optional());

export const zContainerDetailsSchema = z.object({
    id: z.string(),
    created: z.string().datetime(),
    path: z.string(),
    args: z.array(z.string()),
    state: zStateSchema,
    image: z.string(),
    hostnamePath: z.string(),
    hostsPath: z.string(),
    logPath: z.string(),
    name: z.string(),
    restartCount: z.number(),
    mounts: z.array(zMountSchema),
    ports: zPortBindingsSchema,
});

export type ContainerDetails = z.infer<typeof zContainerDetailsSchema>;