import {UserAuthForm} from "@/components/auth-form";

export function Login() {
    return (
            <div className="flex h-screen flex-col items-center px-8 justify-center w-screen md:grid lg:grid-cols-2 lg:px-0">
                <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
                    <div className="absolute inset-0 bg-zinc-900" />
                    <div className="relative z-20 flex items-center text-lg font-medium">
                        Dugong
                    </div>
                    <div className="relative z-20 mt-auto">
                        <div className="space-y-2">
                            <p className="text-xs">
                                v0.0.1 - ALPHA
                            </p>
                        </div>
                    </div>
                </div>
                <div className="lg:p-8">
                    <div className="mx-auto flex flex-col justify-center space-y-6 w-[300px] max-w-[400px]">
                        <div className="flex flex-col space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Login
                            </h1>
                        </div>
                        <UserAuthForm />
                    </div>
                </div>
            </div>
    )
}