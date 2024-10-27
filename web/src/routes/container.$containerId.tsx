import * as React from 'react'
import {
  ErrorComponent,
  createFileRoute,
  useRouter, Link,
} from '@tanstack/react-router'
import {
  useMutation,
  useQueryErrorResetBoundary,
  useSuspenseQuery,
} from '@tanstack/react-query'
import {
  ContainerNotFoundError,
  getContainerDetails,
} from '@/api/get-container-details'
import type { ErrorComponentProps } from '@tanstack/react-router'
import {Button} from "@/components/ui/button";
import {Play, RotateCcw, Square} from "lucide-react";
import {Separator} from "@/components/ui/separator";
import {State} from "@/schemas/container-details";
import {Badge} from "@/components/ui/badge";

export const Route = createFileRoute('/container/$containerId')({
  loader: ({ context: { queryClient }, params: { containerId } }) => {
    return queryClient.ensureQueryData(getContainerDetails(containerId))
  },
  errorComponent: BasicErrorComponent,
  component: ContainerComponent,
})

export function BasicErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  if (error instanceof ContainerNotFoundError) {
    return <div>{error.message}</div>
  }
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  React.useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  return (
    <div>
      <button
        onClick={async () => {
          await router.invalidate()
        }}
      >
        retry
      </button>
      <ErrorComponent error={error} />
    </div>
  )
}

function ContainerComponent() {
  const containerId = Route.useParams().containerId
  const { data: containerDetails, refetch } = useSuspenseQuery(getContainerDetails(containerId))

  const useStopContainerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/containers/${id}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return true;
    },
  })

  const useStartContainerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/containers/${id}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return true;
    },
  })

  const handleAction = (async (running: boolean) => {
    if (running) {
      await useStopContainerMutation.mutateAsync(containerId);
    }
    else {
      await useStartContainerMutation.mutateAsync(containerId);
    }
    await refetch();
  })

  const getStatusColor = (status: State) => {
    if (status.running) {
      return "bg-green-500";
    }
    if (status.dead || status.status == "exited") {
      return "bg-red-500"
    }
    return "bg-gray-500"
  }

  return (
      <div className="container mx-auto p-6 w-full min-w-full flex flex-col gap-6">
        <div className="flex justify-between items-center h-10">
          <h1 className="text-3xl font-semibold"><Link to={"/containers"} className="hover:underline">Containers</Link> / {containerDetails.name.slice(1)}</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                  size="sm"
                  // onClick={async () => }
                  onClick={() => handleAction(containerDetails.state.running)}
              >
                {containerDetails.state.running ? <Square className="h-4 w-4"/> :
                    <Play className="h-4 w-4"/>}
                {containerDetails.state.running ? "Stop" : "Start"}
              </Button>
              {containerDetails.state.running ?
                  <Button
                      variant="secondary"
                      size="sm"
                      // onClick={() => handleAction("restart")}
                  >
                    <RotateCcw className="h-4 w-4"/>
                    Restart
                  </Button>
                  : null}
            </div>
            <Separator className="my-2 w-100"/>

            {/*<h2 className="text-xl font-semibold mb-4">Container Information</h2>*/}
            <div className="space-y-2">
              <div className="flex gap-1">
                <span className="font-semibold">ID:</span>
                <span>{containerDetails.id}</span>
              </div>
              <div className="flex gap-1">
                <span className="font-semibold">Image:</span>
                <span>{containerDetails.image}</span>
              </div>
              <div className="flex gap-1">
                <span className="font-semibold">Status:</span>
                <Badge className={getStatusColor(containerDetails.state)}>
                  {containerDetails.state.status}
                </Badge>
              </div>
              <div className="flex gap-1">
                <span className="font-semibold">Created:</span>
                <span>{new Date(containerDetails.created).toLocaleString()}</span>
              </div>
              <div className="flex gap-1 flex">
                <span className="font-semibold">Ports:</span>
                {Object.keys(containerDetails.ports).map(e =>
                    <div className="flex flex-col">
                      <div className='flex gap-2'>
                        <div>{e}</div>
                        {'->'}
                        <div>{containerDetails.ports[e]?.map(e => `${e.hostPort}`)}</div>
                      </div>
                    </div>
                )}
              </div>
            </div>

          </div>
          {/*<div className="lg:col-span-2">*/}
          {/*  <h2 className="text-xl font-semibold mb-4">Live Logs</h2>*/}
          {/*  /!*<ScrollArea className="h-[400px] w-full rounded-md border p-4 mb-4">*!/*/}
          {/*  /!*  {logs.map((log, index) => (*!/*/}
          {/*  /!*      <div key={index} className="text-sm font-mono">*!/*/}
          {/*  /!*        {log}*!/*/}
          {/*  /!*      </div>*!/*/}
          {/*  /!*  ))}*!/*/}
          {/*  /!*</ScrollArea>*!/*/}
          {/*  <div className="flex justify-between">*/}
          {/*    <Button*/}
          {/*        variant="outline"*/}
          {/*        size="sm"*/}
          {/*        // onClick={() => setIsStreaming(!isStreaming)}*/}
          {/*    >*/}
          {/*      /!*{isStreaming ? "Pause Stream" : "Resume Stream"}*!/*/}
          {/*    </Button>*/}
          {/*    <Button*/}
          {/*        variant="outline"*/}
          {/*        size="sm"*/}
          {/*        // onClick={handleDownloadLogs}*/}
          {/*    >*/}
          {/*      <Download className="h-4 w-4 mr-2"/>*/}
          {/*      Download Logs*/}
          {/*    </Button>*/}
          {/*  </div>*/}
          {/*</div>*/}
        </div>
      </div>
  )
}
