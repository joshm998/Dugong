import * as React from 'react'
import {
    createFileRoute,
} from '@tanstack/react-router'
import {
    useMutation,
    useSuspenseQuery,
} from '@tanstack/react-query'
import {getContainers} from '@/api/get-containers'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {getUptime} from '@/api/get-uptime'
import {Label} from '@/components/ui/label'
import {Spinner} from '@/components/ui/spinner'

export const Route = createFileRoute('/settings')({
    loader: ({context: {queryClient}}) => {
        return queryClient.ensureQueryData(getContainers())
    },
    component: ContainerComponent,
})


function ContainerComponent() {
    const useChangePassword = useMutation({
        mutationFn: async ({oldPassword, newPassword}: { oldPassword: string, newPassword: string }) => {
            const response = await fetch(`/auth/change-password`, {
                method: 'POST',
                body: JSON.stringify({
                    oldPassword: oldPassword,
                    newPassword: newPassword
                })
            });
            if (!response.ok) {
                const message = await response.text()
                throw new Error(message)
            }
            return true;
        },
    })

    async function onPasswordChangeSubmit(event: any) {
        event.preventDefault()
        await useChangePassword.mutateAsync({
            oldPassword: event.target.elements.oldPassword.value,
            newPassword: event.target.elements.newPassword.value,
        })
        event.target.reset();
    }

    return (
        <div className="container mx-auto p-6 w-full min-w-full flex flex-col gap-6">
            <div className="flex justify-between items-center h-10">
                <h1 className="text-3xl font-semibold">Settings</h1>
            </div>
            <div className="flex flex-col gap-2">
                <h2 className="text-xl">Account</h2>
                <h3>Change Password</h3>
                <form onSubmit={onPasswordChangeSubmit} className="max-w-xl">
                    {useChangePassword.isError ? <div>{useChangePassword.error.message}</div> : null}
                    <div className="grid gap-4">
                        <div className="grid gap-1">
                            <Label className="sr-only" htmlFor="oldPassword">
                                Old Password
                            </Label>
                            <Input
                                id="oldPassword"
                                placeholder="Old Password"
                                type="password"
                                required
                                autoCapitalize="none"
                                autoCorrect="off"
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label className="sr-only" htmlFor="newPassword">
                                New Password
                            </Label>
                            <Input
                                id="newPassword"
                                placeholder="New Password"
                                type="password"
                                required
                                autoCapitalize="none"
                                autoCorrect="off"
                            />
                        </div>
                        <Button>
                            {useChangePassword.isPending && (
                                <Spinner className="mr-2 h-4 w-4"/>
                            )}
                            Change Password
                        </Button>
                    </div>
                </form>
            </div>

        </div>
    )
}
