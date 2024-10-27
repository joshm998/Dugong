import {queryOptions} from "@tanstack/react-query";
import {zUptimeListSchema} from "@/schemas/uptime";

export const getUptime = () =>
    queryOptions({
        queryKey: ['uptime'],
        refetchInterval: 10000,
        queryFn: () => fetchUptime(),
    })

export const fetchUptime = async () => {
    const uptimeResponse = await fetch(`/api/health-check/results`);
    if (!uptimeResponse.ok) {
        throw new Error(`Error fetching container - status code ${uptimeResponse.status}`)
    }
    const uptimeJson = await uptimeResponse.json();
    return zUptimeListSchema.parse(uptimeJson);
}