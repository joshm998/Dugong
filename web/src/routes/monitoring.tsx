import * as React from 'react'
import {
  ErrorComponent,
  createFileRoute,
  useRouter,
  Link,
} from '@tanstack/react-router'
import {
    useMutation,
    useQueryErrorResetBoundary,
    useSuspenseQuery,
} from '@tanstack/react-query'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { getContainers } from '@/api/get-containers'
import { Button } from '@/components/ui/button'
import {AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, RefreshCcw, Search, Trash2} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogHeader,
    DialogContent,
    DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEffect, useState } from 'react'
import { getLogs } from '@/api/get-logs'
import { Log } from '@/schemas/log'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import useDebounce from '@/hooks/use-debounce'
import {getUptime} from "@/api/get-uptime";
import {Label} from "@/components/ui/label";
import {Spinner} from "@/components/ui/spinner";
import {getHealthChecks} from "@/api/get-health-checks";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute('/monitoring')({
  loader: ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(getContainers())
  },
  errorComponent: BasicErrorComponent,
  component: ContainerComponent,
})

export function BasicErrorComponent({ error, reset }: ErrorComponentProps) {
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
      <ErrorComponent error={error} />
    </div>
  )
}

const timeIntervals = [
    { value: "1", label: "Last 24 hours" },
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
]

function ContainerComponent() {
    const {data: uptimeResults, refetch: refetchUptime} = useSuspenseQuery(getUptime())
    const {data: healthChecks, refetch: refetchHealthChecks} = useSuspenseQuery(getHealthChecks())
    const [selectedInterval, setSelectedInterval] = useState("1")
    const [addDialogOpen, setAddDialogOpen] = React.useState(false);
    const [selectedId, setSelectedId] = React.useState<number | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const useAddHealthCheck = useMutation({
        mutationFn: async (url: string) => {
            const response = await fetch(`/api/health-checks`, {
                method: 'POST',
                body: JSON.stringify({
                    name: url,
                    interval: 300,
                    url: url
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return true;
        },
    })

    const useDeleteHealthCheck = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/health-checks/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return true;
        },
    })

    async function onSubmit(event: any) {
        event.preventDefault()
        await useAddHealthCheck.mutateAsync(event.target.elements.url.value)
        setAddDialogOpen(false);
        await refetchHealthChecks();
        await refetchUptime();
    }

    async function onDelete() {
        await useDeleteHealthCheck.mutateAsync(selectedId!.toString());
        await refetchHealthChecks();
        await refetchUptime();
        setSelectedId(null)
    }

    return (
        <div className="container mx-auto p-6 w-full min-w-full flex flex-col gap-6">
            <div className="flex justify-between items-center h-10">
                <h1 className="text-3xl font-semibold">Monitoring</h1>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Deleting a health check will also remove all results saved and cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger><Button>Add New Site</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader className="flex gap-2">
                            <DialogTitle>Add a new site</DialogTitle>
                            <form onSubmit={onSubmit}>
                                <div className="grid gap-4">
                                    <div className="grid gap-1">
                                        <Label className="sr-only" htmlFor="url">
                                            Email
                                        </Label>
                                        <Input
                                            id="url"
                                            placeholder="URL"
                                            type="url"
                                            required
                                            autoCapitalize="none"
                                            autoCorrect="off"
                                        />
                                    </div>
                                    <Button>
                                        {useAddHealthCheck.isPending && (
                                            <Spinner className="mr-2 h-4 w-4"/>
                                        )}
                                        Add Site
                                    </Button>
                                </div>
                            </form>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedInterval} onValueChange={setSelectedInterval}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select date range"/>
                    </SelectTrigger>
                    <SelectContent>
                        {timeIntervals.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Site</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uptime</TableHead>
                        <TableHead>Down Events</TableHead>
                        <TableHead>Total Downtime</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {uptimeResults.map((site) => (
                        <TableRow key={site.healthCheckId}>
                            <TableCell>{healthChecks.filter(e => e.id == site.healthCheckId)[0].url}</TableCell>
                            <TableCell>
                                {site.isLatestFailure ? (
                                    <AlertCircle className="h-5 w-5 text-destructive"/>
                                ) : (
                                    <CheckCircle2 className="h-5 w-5 text-green-500"/>
                                )}
                            </TableCell>
                            <TableCell>{site.failedCount != 0 ? (100 - (site.failedCount / (Number(selectedInterval) * 288))).toFixed(3) : 0}%</TableCell>
                            <TableCell>{site.failedCount}</TableCell>
                            <TableCell>{site.failedCount * 5} minutes</TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setDeleteDialogOpen(true)
                                        setSelectedId(site.healthCheckId)
                                    }}
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
