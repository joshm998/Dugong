import {queryOptions} from "@tanstack/react-query";
import {zContainersSchema} from "@/schemas/container";

export const getContainers = () =>
    queryOptions({
        queryKey: ['containers'],
        refetchInterval: 10000,
        queryFn: () => fetchContainers(),
    })

export const fetchContainers = async () => {
    const containersResponse = await fetch(`/api/containers`);
    if (!containersResponse.ok) {
        throw new Error(`Error fetching container - status code ${containersResponse.status}`)
    }
    const containersJson = await containersResponse.json();
    return zContainersSchema.parse(containersJson);
}