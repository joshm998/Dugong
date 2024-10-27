import {queryOptions} from "@tanstack/react-query";
import {zHealthCheckListSchema} from "@/schemas/health-checks";

export const getHealthChecks = () =>
    queryOptions({
        queryKey: ['health-checks'],
        queryFn: () => fetchHealthChecks(),
    })

export const fetchHealthChecks = async () => {
    const healthChecksResponse = await fetch(`/api/health-checks`);
    if (!healthChecksResponse.ok) {
        throw new Error(`Error fetching container - status code ${healthChecksResponse.status}`)
    }
    const healthChecksJson = await healthChecksResponse.json();
    return zHealthCheckListSchema.parse(healthChecksJson);
}