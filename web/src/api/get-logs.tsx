import { queryOptions } from "@tanstack/react-query";
import {zLogsResponseSchema} from "@/schemas/log";

export const getLogs = (
    page: number,
    pageSize: number,
    container: string | undefined,
    logLevel: string | undefined,
    query: string | undefined
) =>
    queryOptions({
        queryKey: ['logs', page, pageSize],
        // refetchInterval: 10000,
        queryFn: () => fetchLogs(page, pageSize, container, logLevel, query),
    })

export const fetchLogs = async (
    page: number,
    pageSize: number,
    container: string | undefined,
    logLevel: string | undefined,
    query: string | undefined
) => {
    const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
    });

    if (container && container != "all") {
        params.append('containerIds', container);
    }

    if (logLevel && logLevel != "all") {
        params.append('logLevels', logLevel);
    }

    if (query) {
        params.append('message', query);
    }

    const logsResponse = await fetch(`/api/logs?${params.toString()}`);
    if (!logsResponse.ok) {
        throw new Error(`Error fetching logs - status code ${logsResponse.status}`)
    }
    const logsJson = await logsResponse.json();
    return zLogsResponseSchema.parse(logsJson);
}