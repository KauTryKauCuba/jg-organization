import { Head, useForm } from '@inertiajs/react';
import { Building2, Loader2 } from 'lucide-react';
import type { FormEventHandler } from 'react';
import InputError from '@/components/input-error';
import { Component as SilkBackground } from '@/components/silk-background-animation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { home } from '@/routes';
import { store } from '@/routes/organization';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Get Started',
        href: '#',
    },
];

const roles = [
    'HR Director',
    'HR Manager',
    'HR Officer',
    'Owner',
    'Founder',
    'CEO',
];

export default function Onboarding() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        role: '',
        parent_id: 'none', // Required by controller logic but hidden here
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(store.url());
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} logoHref={home.url()}>
            <Head title="Create Your First Organization" />
            
            <div className="relative flex h-full flex-1 flex-col gap-4 overflow-hidden rounded-xl">
                <div className="absolute inset-0 z-0">
                    <SilkBackground />
                </div>
                <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-lg border-t-4 border-t-blue-600 bg-white/95 backdrop-blur-sm dark:bg-zinc-950/95">
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-4">
                                <Building2 className="h-8 w-8 text-blue-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Welcome to JobGiga</CardTitle>
                            <CardDescription className="text-base mt-2">
                                To get started, please create your first organization. This will be the root of your company hierarchy.
                            </CardDescription>
                        </CardHeader>
                        
                        <form onSubmit={submit}>
                            <CardContent className="space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Organization Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Acme Corp"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoFocus
                                        className={`mt-1 block w-full ${errors.name ? 'border-red-500' : ''}`}
                                    />
                                    <InputError className="mt-2" message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="role">Your Role / Job Title</Label>
                                    <Select 
                                        value={data.role} 
                                        onValueChange={(value) => setData('role', value)}
                                        required
                                    >
                                        <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select your role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError className="mt-2" message={errors.role} />
                                </div>
                            </CardContent>
                            
                            <CardFooter className="flex flex-col gap-4 pt-6">
                                <Button 
                                    type="submit" 
                                    className="w-full" 
                                    disabled={processing || !data.name.trim() || !data.role}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Organization & Get Started'
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
