import * as React from 'react'
import {
    ErrorComponent,
    createFileRoute,
    useRouter, Link,
} from '@tanstack/react-router'
import {
    useQueryErrorResetBoundary,
    useSuspenseQuery,
} from '@tanstack/react-query'
import type {ErrorComponentProps} from '@tanstack/react-router'
import {getContainers} from "@/api/get-containers";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Play, RefreshCcw, Square, Trash2} from "lucide-react";
import {Spinner} from "@/components/ui/spinner";
import {stopContainerMutation} from "@/api/stop-container";

export const Route = createFileRoute('/containers')({
    loader: ({context: {queryClient}}) => {
        return queryClient.ensureQueryData(getContainers())
    },
    errorComponent: BasicErrorComponent,
    component: ContainerComponent,
})

export function BasicErrorComponent({error, reset}: ErrorComponentProps) {
    const router = useRouter()
    const queryErrorResetBoundary = useQueryErrorResetBoundary()

    React.useEffect(() => {
        queryErrorResetBoundary.reset()
    }, [queryErrorResetBoundary])

    return (
        <div>
            <button
                onClick={() => {
                    router.invalidate()
                }}
            >
                retry
            </button>
            <ErrorComponent error={error}/>
        </div>
    )
}

function ContainerComponent() {
    const {data: containers, refetch, isRefetching} = useSuspenseQuery(getContainers())

    const getStatusColor = (status: string) => {
        switch (status) {
            case "running":
                return "text-green-500"
            case "exited":
                return "text-red-500"
            default:
                return "text-gray-500"
        }
    }

    return (
        <div className="container mx-auto p-6 w-full min-w-full flex flex-col gap-6">
            <div className="flex justify-between items-center h-10">
                <h1 className="text-3xl font-semibold">Containers</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {containers.map((container) => (
                    <Link to={"/container/$containerId"} params={{containerId: container.id}}>
                        <Card key={container.id}>
                            <CardHeader>
                                <CardTitle>{container.names[0].slice(1)}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 truncate">Image: {container.image}</p>
                                <p className={`text-sm font-semibold ${getStatusColor(container.state)}`}>
                                    Status: {container.state}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
