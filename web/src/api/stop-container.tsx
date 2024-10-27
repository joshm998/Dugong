import {queryOptions, useMutation} from "@tanstack/react-query";
import {zSystemUsage} from "@/schemas/system-usage";

export const useStopContainerMutation = useMutation({
    mutationFn: async (id: string) => {
        const response = await fetch(`/api/containers/${id}/stop`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return response.json();
    },
})