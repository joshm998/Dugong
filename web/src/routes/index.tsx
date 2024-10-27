import * as React from 'react'
import {createFileRoute, Link} from '@tanstack/react-router'
import {Activity, AlertTriangle, Cpu, HardDrive, RefreshCcw} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Progress} from "@/components/ui/progress";
import {getSystemUsage} from "@/api/get-system-usage";
import {useSuspenseQuery} from "@tanstack/react-query";
import {getContainers} from "@/api/get-containers";

export const Route = createFileRoute('/')({
    loader: ({context: {queryClient}}) => {
        return queryClient.ensureQueryData(getSystemUsage())
    },
    component: HomeComponent,
})

function HomeComponent() {
    const {data: usage} = useSuspenseQuery(getSystemUsage())
    const {data: containers} = useSuspenseQuery(getContainers())

    return (
        <div className="container mx-auto p-6 w-full min-w-full flex flex-col gap-6">
            <div className="flex justify-between items-center h-10">
                <h1 className="text-3xl font-semibold">Dashboard</h1>
            </div>

            <div id="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 py-4">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold flex items-center">
                                <Cpu className="mr-2 h-4 w-4"/> CPU Usage
                            </span>
                            <span>{usage.cpu.usagePercent.toFixed(2)}%</span>
                        </div>
                        <Progress value={usage.cpu.usagePercent} className="w-full"/>
                    </div>
                    <div className="space-y-2  py-4">
                        <div className="flex justify-between items-center">
                              <span className="font-semibold flex items-center">
                                <Activity className="mr-2 h-4 w-4"/> Memory Usage
                              </span>
                            <span>{usage.memory.usagePercent.toFixed(2)}%</span>
                        </div>
                        <Progress value={usage.memory.usagePercent} className="w-full"/>
                    </div>

                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <Link to="/containers" className="w-fit">
                            <CardTitle className="text-lg text-text hover:underline">Containers Running</CardTitle>
                        </Link>
                    </CardHeader>
                    <CardContent className="flex gap-1">
                        <div className="text-4xl font-semibold font-mono text-text">{containers.filter(e => e.state != "exited").length}/{containers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Link to="/logs" className="w-fit">
                            <CardTitle className="text-lg text-text hover:underline">Errors in Last 24 Hours</CardTitle>
                        </Link>
                    </CardHeader>
                    <CardContent className="flex gap-1">
                        <div className="text-4xl font-semibold font-mono text-text">0</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Link to="/logs" className="w-fit">
                            <CardTitle className="text-lg text-text hover:underline">Downtime Events</CardTitle>
                        </Link>
                    </CardHeader>
                    <CardContent className="flex gap-1">
                        <div className="text-4xl font-semibold font-mono text-text">0</div>
                    </CardContent>
                </Card>
            </div>

            <div id="containers" className="mb-12">
                <h2 className="text-2xl font-semibold mb-6">Running Containers</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {containers.filter(e => e.state != "exited").map((container) => (
                            <TableRow key={container.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/container/${container.id}`}
                                          className="text-primary hover:underline">
                                        {container.names[0].slice(1)}
                                    </Link>
                                </TableCell>
                                <TableCell>{container.image}</TableCell>
                                <TableCell>{container.status}</TableCell>
                                <TableCell>{container.id}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
