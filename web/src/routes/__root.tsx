import * as React from 'react'
import {Outlet, createRootRoute, redirect} from '@tanstack/react-router'
import {Sidebar, SidebarItem} from "@/components/ui/sidebar";
import {useQuery} from "@tanstack/react-query";
import {useGetAuthStatus} from "@/api/get-auth-status";
import {Spinner} from "@/components/ui/spinner";
import {Suspense} from "react";
import {TanStackRouterDevtools, TanStackQueryDevtools} from "@/components/devtools"
import {Binoculars, Container, Home, LogOut, Logs, Settings} from "lucide-react";


export const Route = createRootRoute({
    component: RootComponent,
    beforeLoad: async ({ context }) => {
        if (location.pathname === '/login') {
            return
        }

        const { queryClient } = context
        const isAuthenticated = await queryClient.fetchQuery(useGetAuthStatus())
        if (!isAuthenticated) {
            throw redirect({
                to: '/login',
            })
        }
    },
})

function RootComponent() {
    const { data: isAuthenticated = false, isLoading: loading, refetch: refetchAuth } = useQuery(useGetAuthStatus());

    if (loading) {
        return <div className="flex w-screen h-screen">
            <div className="m-auto flex gap-2">
                <Spinner className=""/>Loading
            </div>
        </div>
    }

    if (location.pathname === "/login") {
        return <Outlet />
    }

    return (
        <div className="flex">
            <Sidebar>
                <SidebarItem to="/" icon={<Home className="h-5 w-5 sm:h-6 sm:w-6 text-sidebar-primary" />} label="Home" />
                <SidebarItem to="/containers" icon={<Container className="h-5 w-5 sm:h-6 sm:w-6 text-sidebar-primary" />} label="Containers" />
                <SidebarItem to="/logs" icon={<Logs className="h-5 w-5 sm:h-6 sm:w-6  text-sidebar-primary" />} label="Logging" />
                <SidebarItem to="/monitoring" icon={<Binoculars className="h-5 w-5 sm:h-6 sm:w-6  text-sidebar-primary" />} label="Monitoring" />
                <div className="flex flex-grow" />
                <SidebarItem to="/settings" icon={<Settings className="h-5 w-5 sm:h-6 sm:w-6  text-sidebar-primary" />} label="Settings" />
                <SidebarItem isLink className="mb-2 sm:mb-6" to="/auth/logout" icon={<LogOut className="h-5 w-5 sm:h-6 sm:w-6 text-sidebar-primary" />} label="Log Out" />

            </Sidebar>
            <main className="w-full ml-10 sm:ml-20 min-w-48 flex flex-col">
                <Outlet/>

                <Suspense>
                    <TanStackRouterDevtools position="bottom-right" />
                    <TanStackQueryDevtools buttonPosition="bottom-right"/>
                </Suspense>
            </main>
    </div>
    )
}
