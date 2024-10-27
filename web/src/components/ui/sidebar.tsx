import {ReactNode} from 'react'
import {cn} from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {Link} from "@tanstack/react-router";
import {Icon} from "@/components/icon";

export function Sidebar({
                            className,
                            children
                        }: {
    className?: string
    children: ReactNode
}) {
    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn("sm:min-w-20 min-w-10 h-screen fixed flex flex-col border-r bg-sidebar gap-2", className)}>
                <Icon className={"mx-auto mt-3 sm:mt-6 sm:mb-4 w-8 h-10 sm:w-14"}/>
                {children}
            </aside>
        </TooltipProvider>
    )
}

export function SidebarItem({icon, label, to, className, isLink}: {
    icon: ReactNode
    label: string
    to: string
    className?: string
    isLink?: boolean
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {isLink ?
                    <a href={to}
                             className={cn(
                                 "flex h-8 sm:h-12 w-8 sm:w-12 mx-auto gap-2 items-center justify-center rounded-md hover:brightness-[130%] bg-sidebar",
                                 className
                             )}>
                        {icon}
                    </a> :
                    <Link
                        to={to}
                        activeOptions={{exact: true}}
                        activeProps={{className: 'brightness-[130%]'}}
                        className={cn(
                            "flex h-8 sm:h-12 w-8 sm:w-12 mx-auto gap-2 items-center justify-center rounded-md hover:brightness-[130%] bg-sidebar",
                            className
                        )}
                    >
                        {icon}
                    </Link>}
            </TooltipTrigger>
            <TooltipContent side="right">
                {label}
            </TooltipContent>
        </Tooltip>
    )
}