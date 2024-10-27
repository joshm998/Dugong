import { createFileRoute } from '@tanstack/react-router'
import { UserAuthForm } from "@/components/auth-form"
import {Icon} from "@/components/icon";
import {Badge} from "@/components/ui/badge";

export const Route = createFileRoute('/login')({
    component: Login,
})

function Login() {
    return (
        <div
            className="flex h-screen flex-col items-center px-8 justify-center w-screen lg:grid lg:grid-cols-2 lg:px-0 bg-primary lg:bg-white">
            <div className="relative hidden h-full flex-col bg-primary p-10 text-white dark:border-r lg:flex">
                <div className="absolute inset-0 bg-primary"/>
                <div className="relative z-20 flex text-lg font-medium">
                    <Icon className={"h-32 w-32"}/>
                </div>
                <div className="relative z-20 mt-auto">
                    <div className="space-y-1">
                        <p className="text-2xl">Dugong</p>
                        <p className="text-xs">
                            <Badge variant="secondary" className="text-xs px-1 py-1 h-4">v0.0.1</Badge>
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col text-lg font-medium mx-auto lg:hidden mb-auto mt-10">
                <Icon className={"h-32 w-32"}/>
                <div className="space-y-1 mx-auto flex flex-col">
                    <p className="text-2xl text-secondary">Dugong</p>
                    <Badge variant="secondary" className="text-xs px-1 py-1 h-4 mx-auto">v0.0.1</Badge>
                </div>
            </div>
            <div className="lg:p-8 bg-white p-10 rounded-lg mb-auto fixed lg:relative lg:my-auto">

                <div className="mx-auto flex flex-col justify-center space-y-6 w-[250px] lg:w-[300px] max-w-[400px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Login
                        </h1>
                    </div>
                    <UserAuthForm/>
                </div>

            </div>

        </div>
    )
}
