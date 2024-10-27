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
import {getContainers} from '@/api/get-containers'
import {Button} from '@/components/ui/button'
import {ChevronLeft, ChevronRight, RefreshCcw, Search} from 'lucide-react'
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Dialog, DialogHeader, DialogContent, DialogTitle} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useEffect, useState} from "react";
import {getLogs} from "@/api/get-logs";
import {Log} from "@/schemas/log";
import {ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable} from "@tanstack/react-table";
import useDebounce from "@/hooks/use-debounce";

export const Route = createFileRoute('/logs')({
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
    const {
        data: containers,
    } = useSuspenseQuery(getContainers())

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 100, // Adjust page size if necessary
    });
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedLevel, setSelectedLevel] = useState("all")
    const [selectedLog, setSelectedLog] = useState<Log | null>(null)
    const [selectedContainer, setSelectedContainer] = useState<string>("all")
    // const [dateRange, setDateRange] = useState("24h")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCustomDatePickerOpen, setIsCustomDatePickerOpen] = useState(false)
    const debouncedSearch = useDebounce(searchTerm, 500);

    const { data: logs, refetch } = useSuspenseQuery(getLogs(pagination.pageIndex, pagination.pageSize, selectedContainer, selectedLevel, debouncedSearch))

    useEffect(() => {
        refetch()
    }, [selectedLevel, selectedContainer, debouncedSearch])

    const columns = React.useMemo<ColumnDef<Log>[]>(
        () => [
        {
            accessorKey: "timestamp",
            header: "Timestamp",
            cell: (info) => new Date(info.getValue() as any).toLocaleString(),
        },
        {
            accessorKey: "logLevel",
            header: "Level",
            cell: (info) => (
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors(
                        info.getValue() as any
                    )}`}
                >
        {(info.getValue() as any).toUpperCase()}
      </span>
            ),
        },
        {
            accessorKey: "message",
            header: "Message",
            meta: {
                cellClassName: 'w-full'
            },
            cell: (info) => (
                <div className="overflow-ellipsis whitespace-nowrap max-w-32 sm:max-w-sm lg:max-w-md xl:max-w-xl 2xl:max-w-full overflow-hidden w-full">
                    {info.getValue()  as any}
                </div>
            ),
        },
        {
            accessorKey: "containerId",
            header: "Container",
            cell: (info) => (
                <Link to={`/container/${info.getValue()}`}>
                    {containers.find((e) => e.id === info.getValue())?.names[0].slice(1)}
                </Link>
            ),
        },
        {
            accessorKey: "actions",
            header: "Actions",
            cell: (info) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(info.row.original)}
                >
                    View Details
                </Button>
            ),
        },
    ], []);

    const dateRangeOptions = [
        {label: "Last 30 minutes", value: "30m"},
        {label: "Last 1 hour", value: "1h"},
        {label: "Last 3 hours", value: "3h"},
        {label: "Last 6 hours", value: "6h"},
        {label: "Last 12 hours", value: "12h"},
        {label: "Last 24 hours", value: "24h"},
        {label: "Last 2 days", value: "2d"},
        {label: "Last 7 days", value: "7d"},
        {label: "Custom Range", value: "custom"},
    ]

    // const handleDateRangeChange = (value: string) => {
    //     setDateRange(value)
    //     if (value === "custom") {
    //         setIsCustomDatePickerOpen(true)
    //     } else {
    //         setIsCustomDatePickerOpen(false)
    //     }
    // }

    const handleViewDetails = (log: Log) => {
        setSelectedLog(log)
        setIsModalOpen(true)
    }

    const levelColors = (logLevel: string) => {
        switch (logLevel.toLowerCase()) {
            case "info":
                return "bg-green-100 text-green-800"
            case "warn":
                return "bg-red-100 text-red-800"
            case "error":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const table = useReactTable({
        data: logs.logs || [],
        columns,
        pageCount: logs.totalPages || 0, // Based on total pages from API response
        state: {
            pagination,
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        manualPagination: true, // We're using server-side pagination
    });

    return (
        <div className="container mx-auto p-6 w-full min-w-full flex flex-col gap-6">
            <div className="flex justify-between items-center h-10">
                <h1 className="text-3xl font-semibold">Logs</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select level"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="INFO">Info</SelectItem>
                        <SelectItem value="WARN">Warning</SelectItem>
                        <SelectItem value="ERROR">Error</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={selectedContainer} onValueChange={setSelectedContainer}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select container"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Containers</SelectItem>
                        {containers.map((container) => {
                            const name = container.names[0].slice(1)
                            return <SelectItem key={name} value={container.id}>{name}</SelectItem>
                        })}
                    </SelectContent>
                </Select>
                {/*<Select value={dateRange} onValueChange={handleDateRangeChange}>*/}
                {/*    <SelectTrigger className="w-full sm:w-[180px]">*/}
                {/*        <SelectValue placeholder="Select date range"/>*/}
                {/*    </SelectTrigger>*/}
                {/*    <SelectContent>*/}
                {/*        {dateRangeOptions.map((option) => (*/}
                {/*            <SelectItem key={option.value} value={option.value}>*/}
                {/*                {option.label}*/}
                {/*            </SelectItem>*/}
                {/*        ))}*/}
                {/*    </SelectContent>*/}
                {/*</Select>*/}
            </div>

            {/*{isCustomDatePickerOpen && (*/}
            {/*    <div className="flex gap-4">*/}
            {/*        <Popover>*/}
            {/*            <PopoverTrigger asChild>*/}
            {/*                <Button variant="outline">*/}
            {/*                    {startDate ? format(startDate, "PPP") : "Pick a start date"}*/}
            {/*                </Button>*/}
            {/*            </PopoverTrigger>*/}
            {/*            <PopoverContent className="w-auto p-0" align="start">*/}
            {/*                <CalendarComponent*/}
            {/*                    mode="single"*/}
            {/*                    selected={startDate}*/}
            {/*                    onSelect={setStartDate}*/}
            {/*                    initialFocus*/}
            {/*                />*/}
            {/*            </PopoverContent>*/}
            {/*        </Popover>*/}
            {/*        <Popover>*/}
            {/*            <PopoverTrigger asChild>*/}
            {/*                <Button variant="outline">*/}
            {/*                    {endDate ? format(endDate, "PPP") : "Pick an end date"}*/}
            {/*                </Button>*/}
            {/*            </PopoverTrigger>*/}
            {/*            <PopoverContent className="w-auto p-0" align="start">*/}
            {/*                <CalendarComponent*/}
            {/*                    mode="single"*/}
            {/*                    selected={endDate}*/}
            {/*                    onSelect={setEndDate}*/}
            {/*                    initialFocus*/}
            {/*                />*/}
            {/*            </PopoverContent>*/}
            {/*        </Popover>*/}
            {/*    </div>*/}
            {/*)}*/}

            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map(row => {
                        return (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map(cell => {
                                    return (
                                        <TableCell key={cell.id}
                                                   className={(cell.column.columnDef.meta as any)?.cellClassName}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        )
                    })}
                    {/*{table.getRowModel().rows.map((row) => (*/}
                    {/*    <TableRow key={row.id}>*/}
                    {/*        {row.getVisibleCells().map((cell) => (*/}
                    {/*            <TableCell key={cell.id}>{cell.r()}</TableCell>*/}
                    {/*        ))}*/}
                    {/*    </TableRow>*/}
                    {/*))}*/}
                </TableBody>
            </Table>

            <div className="flex justify-between items-center">
                <Button variant="secondary" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    <ChevronLeft className="h-4 w-4"/> Previous
                </Button>
                <span>Page {logs.page} of {logs.totalPages}</span>
                <Button variant="secondary" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    Next <ChevronRight className="h-4 w-4"/>
                </Button>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[1000px]">
                    <DialogHeader>
                        <DialogTitle>Log Details</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="mt-4 space-y-4">
                            <div>
                                <strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}
                            </div>
                            <div>
                                <strong>Level:</strong>
                                <span
                                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${levelColors(selectedLog.logLevel)}`}>
                  {selectedLog.logLevel.toUpperCase()}
                </span>
                            </div>
                            <div>
                                <strong>Container:</strong> {selectedLog.containerId}
                            </div>
                            <div>
                                <strong>Message:</strong>
                                <pre className="mt-2 p-2 bg-muted rounded-md break-words break-all whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.message, null, 2)}
                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
