"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Spinner} from "@/components/ui/spinner";
import {useMutation} from "@tanstack/react-query";
import {redirect} from "@tanstack/react-router";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {

    const loginMutation = useMutation({
        mutationFn: async ({username, password}: {username: string, password: string}) => {
            const response = await fetch(`/auth/login`, {
                method: 'POST',
                body: JSON.stringify({username, password}),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return true;
        },
        onSuccess: data => {
            window.location.pathname = "/"
        }
    })

    async function onSubmit(event: any) {
        event.preventDefault()
        await loginMutation.mutateAsync({
            username: event.target.elements.username.value,
            password: event.target.elements.password.value,
        });
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={onSubmit}>
                <div className="grid gap-4">
                    {loginMutation.isError ? <div className="text-sm">Username or Password is incorrect</div> : null}
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="username">
                            Email
                        </Label>
                        <Input
                            id="username"
                            placeholder="Username"
                            type="text"
                            required
                            autoCapitalize="none"
                            autoCorrect="off"
                            disabled={loginMutation.isPending}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="password">
                            Password
                        </Label>
                        <Input
                            id="password"
                            placeholder="Password"
                            type="password"
                            required
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={loginMutation.isPending}
                        />
                    </div>
                    <Button disabled={loginMutation.isPending}>
                        {loginMutation.isPending && (
                            <Spinner className="mr-2 h-4 w-4"/>
                        )}
                        Sign In
                    </Button>
                </div>
            </form>
        </div>
    )
}