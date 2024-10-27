import {queryOptions} from "@tanstack/react-query";
import {zSystemUsage} from "@/schemas/system-usage";

export const getSystemUsage = () =>
    queryOptions({
        queryKey: ['system-usage'],
        refetchInterval: 5000,
        queryFn: () => fetchContainerDetails(),
    })

export const fetchContainerDetails = async () => {
    const usageResponse = await fetch(`/api/usage`);
    if (!usageResponse.ok) {
        throw new Error(`Error fetching usage - status code ${usageResponse.status}`)
    }
    const usageJson = await usageResponse.json();

    return zSystemUsage.parse(usageJson);
}