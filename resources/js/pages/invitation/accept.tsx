import { Head, useForm, router } from '@inertiajs/react';
import { Network } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
interface Organization {
    id: number;
    name: string;
    parent_id: number | null;
}

interface Props {
    senderOrg: Organization;
    type: 'parent' | 'subsidiary';
    userOrgs: Organization[];
    signature?: string;
    expires?: string;
}

export default function AcceptInvitation({ senderOrg, type, userOrgs }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        receiver_org_id: userOrgs.length === 1 ? userOrgs[0].id.toString() : '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // Use window.location.href to preserve the signature query parameter
        post(window.location.href);
    };

    // Handle case where user has no organizations
    if (userOrgs.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Head title="Action Required" />
                <Card className="w-full max-w-md">
                     <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                                <Network className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                        <CardTitle className="text-center">Organization Required</CardTitle>
                        <CardDescription className="text-center">
                            You need to create an organization profile before you can accept this connection request.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button onClick={() => router.visit('/onboarding')} className="w-full">
                            Create Organization
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Determine the message based on type
    // If type is 'subsidiary', Sender invites Receiver to be Subsidiary.
    // If type is 'parent', Sender requests Receiver to be Parent.
    
    const title = type === 'subsidiary' 
        ? `Join ${senderOrg.name}`
        : `Connect with ${senderOrg.name}`;

    const description = type === 'subsidiary'
        ? `${senderOrg.name} has invited you to join their organization structure as a subsidiary.`
        : `${senderOrg.name} has requested to join your organization structure as a subsidiary (you will be the parent).`;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Head title="Accept Invitation" />
            
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-blue-600">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <Network className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <CardTitle className="text-center text-xl">{title}</CardTitle>
                    <CardDescription className="text-center pt-2">
                        {description}
                    </CardDescription>
                </CardHeader>
                
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Your Organization</Label>
                            <Select 
                                value={data.receiver_org_id} 
                                onValueChange={(val) => setData('receiver_org_id', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select organization..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {userOrgs.map(org => (
                                        <SelectItem key={org.id} value={org.id.toString()}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.receiver_org_id && (
                                <p className="text-sm text-destructive">{errors.receiver_org_id}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Select which of your organizations should accept this connection.
                            </p>
                        </div>

                        <Button className="w-full" disabled={processing || !data.receiver_org_id}>
                            {processing ? 'Connecting...' : 'Accept & Connect'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t pt-4 bg-muted/50 rounded-b-lg">
                    <p className="text-xs text-muted-foreground text-center">
                        This action will establish a formal relationship between the organizations.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
