import {queryOptions} from "@tanstack/react-query";
import {zSystemUsage} from "@/schemas/system-usage";

export const useGetAuthStatus = () =>
    queryOptions({
        queryKey: ['auth-status'],
        queryFn: () => fetchContainerDetails(),
        retry: false
    })

export const fetchContainerDetails = async () => {
    const usageResponse = await fetch(`/api/auth-status`);
    return usageResponse.status == 200;
}