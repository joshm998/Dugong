import {queryOptions} from "@tanstack/react-query";
import {zContainerDetailsSchema} from "@/schemas/container-details";

export class ContainerNotFoundError extends Error {}

export const getContainerDetails = (containerId: string) =>
    queryOptions({
        queryKey: ['container-details', { containerId }],
        queryFn: () => fetchContainerDetails(containerId),
    })

export const fetchContainerDetails = async (containerId: string) => {
    console.info(`Fetching post with id ${containerId}...`)
    const containerResponse = await fetch(`/api/containers/${containerId}`);
    if (!containerResponse.ok) {
        if (containerResponse.status === 404) {
            throw new ContainerNotFoundError(`Container with id "${containerId}" not found!`)
        }
        throw new Error(`Error fetching container - status code ${containerResponse.status}`)
    }
    const containerDetailsJson = await containerResponse.json();

    return zContainerDetailsSchema.parse(containerDetailsJson);
}