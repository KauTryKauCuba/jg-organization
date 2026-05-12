import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Pencil, Trash2, RefreshCw, Plus, Building2, Building, Eye, EyeOff, Copy, Check, Network, LayoutList, User, ZoomIn, ZoomOut, ChevronDown, ChevronUp, Minus, Briefcase, Search, X, Mail, Maximize2, Minimize2, MousePointer2, Key, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { FormEventHandler} from 'react';
import { Badge } from '@/components/ui/badge';
import { ShineBorder } from '@/components/ui/shine-border';
import NeuralBackground from '@/components/flow-field-background';
import RoleCombobox from '@/components/role-combobox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// Component to display/copy invite code
const InviteCode = ({ code, className = "" }: { code?: string, className?: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!code) return null;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleVisibility = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
    };

    return (
        <div className={`flex items-center gap-1.5 bg-black/20 rounded-md px-2 py-0.5 border border-white/10 ${className}`} onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-slate-400 font-mono select-all">
                {isVisible ? code : '••••••••••'}
            </span>
            <button 
                onClick={toggleVisibility} 
                className="text-slate-400 hover:text-white transition-colors focus:outline-none"
                title={isVisible ? "Hide Code" : "Show Code"}
            >
                {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
            <button 
                onClick={handleCopy} 
                className="text-slate-400 hover:text-white transition-colors focus:outline-none"
                title="Copy Code"
            >
                {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            </button>
        </div>
    );
};

// Component: Pending Invitations List
const PendingInvitationsList = ({ invitations }: { invitations: OrganizationInvitation[] }) => {
    if (invitations.length === 0) return null;

    const handleAction = (id: number, status: 'accepted' | 'declined') => {
        router.put(`/organization/invitation/${id}`, { status });
    };

    return (
        <Card className="border-orange-500/50 bg-orange-500/5 mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2 text-lg">
                    <Mail className="h-5 w-5" />
                    Pending Connection Requests
                </CardTitle>
                <CardDescription>
                    Other organizations want to connect with your organizations.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {invitations.map((invitation) => (
                        <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background/80 backdrop-blur-sm rounded-lg border border-orange-200 dark:border-orange-900/50 gap-4">
                            <div>
                                <div className="font-medium text-foreground flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    {invitation.sender.name}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {invitation.type === 'parent' 
                                        ? <span>Requesting you to be their <strong>Parent Organization</strong>.</span>
                                        : <span>Requesting you to be their <strong>Subsidiary Organization</strong>.</span>
                                    }
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Sent: {new Date(invitation.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/50 dark:hover:bg-red-900/20"
                                    onClick={() => handleAction(invitation.id, 'declined')}
                                >
                                    Decline
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                    onClick={() => handleAction(invitation.id, 'accepted')}
                                >
                                    Accept
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

// Component: Pending Confirmations List (Sender needs to confirm)
const PendingConfirmationsList = ({ invitations }: { invitations: OrganizationInvitation[] }) => {
    if (invitations.length === 0) return null;

    const handleAction = (id: number) => {
        router.put(`/organization/invitation/${id}`, { status: 'confirmed' });
    };

    return (
        <Card className="border-emerald-500/50 bg-emerald-500/5 mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-lg">
                    <Check className="h-5 w-5" />
                    Ready to Connect
                </CardTitle>
                <CardDescription>
                    These organizations have accepted your invitation. Confirm to finalize the connection.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {invitations.map((invitation) => (
                        <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background/80 backdrop-blur-sm rounded-lg border border-emerald-200 dark:border-emerald-900/50 gap-4">
                            <div>
                                <div className="font-medium text-foreground flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    {invitation.receiver.name}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {invitation.type === 'subsidiary'
                                        ? <span>Accepted your request to join as a <strong>Subsidiary</strong>.</span>
                                        : <span>Accepted your request to become your <strong>Parent Organization</strong>.</span>
                                    }
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Accepted: {new Date(invitation.updated_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button 
                                    size="sm" 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleAction(invitation.id)}
                                >
                                    Confirm Connection
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

// Component: Send Invitation Form
const SendInvitationForm = ({ 
    organizations, 
    currentOrgId, 
    onSuccess,
    defaultType = 'subsidiary',
    lockType = false,
    className = ""
}: { 
    organizations: Organization[], 
    currentOrgId?: number, 
    onSuccess?: () => void,
    defaultType?: 'parent' | 'subsidiary',
    lockType?: boolean,
    className?: string
}) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        type: defaultType,
        organization_id: currentOrgId?.toString() || (organizations.length > 0 ? organizations[0].id.toString() : ''),
    });

    const [inviteMethod, setInviteMethod] = useState<'code' | 'link'>('code');
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/organization/invitation', {
            onSuccess: () => {
                reset('code');
                onSuccess?.();
            },
        });
    };

    const handleGenerateLink = async () => {
        if (!data.organization_id || !data.type) return;
        
        setIsGeneratingLink(true);
        setErrorMessage(null);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!csrfToken) {
                 setErrorMessage('CSRF token not found. Please refresh the page.');
                 setIsGeneratingLink(false);
                 return;
            }

            const response = await fetch('/organization/invitation/link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    type: data.type,
                    sender_org_id: data.organization_id
                })
            });
            
            if (response.ok) {
                const resData = await response.json();
                setGeneratedLink(resData.url);
            } else {
                console.error('Failed to generate link', response.status);
                const errorData = await response.json().catch(() => ({}));
                setErrorMessage(errorData.message || 'Failed to generate link. Please try again.');
            }
        } catch (error) {
            console.error(error);
            setErrorMessage('An unexpected error occurred.');
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const copyLink = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    // Update organization_id if currentOrgId changes and isn't set yet
    useEffect(() => {
        if (currentOrgId) {
            setData('organization_id', currentOrgId.toString());
        }
    }, [currentOrgId]);

    // Update type if defaultType changes (and we are locked)
    useEffect(() => {
        if (lockType && defaultType) {
            setData('type', defaultType);
        }
    }, [defaultType, lockType]);

    // Clear generated link if parameters change
    useEffect(() => {
        setGeneratedLink(null);
    }, [data.type, data.organization_id]);

    const commonFields = (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="org-select">My Organization</Label>
                <Select 
                    value={data.organization_id} 
                    onValueChange={(val) => setData('organization_id', val)}
                    disabled={!!currentOrgId} // Lock if currentOrgId is provided (context specific)
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select your organization" />
                    </SelectTrigger>
                    <SelectContent>
                        {organizations.filter(o => !o.deleted_at).map(org => (
                            <SelectItem key={org.id} value={org.id.toString()}>
                                {org.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.organization_id && <p className="text-xs text-destructive">{errors.organization_id}</p>}
            </div>

            <div className={`grid gap-2 ${lockType ? 'hidden' : ''}`}>
                <Label htmlFor="connection-type">Relationship Type</Label>
                    <Select 
                    value={data.type} 
                    onValueChange={(val) => setData('type', val as 'parent' | 'subsidiary')}
                    disabled={lockType}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="subsidiary">Add as Subsidiary</SelectItem>
                        <SelectItem value="parent">Request as Parent</SelectItem>
                    </SelectContent>
                </Select>
                    <p className="text-[10px] text-muted-foreground">
                    {data.type === 'subsidiary' 
                        ? "You are inviting them to join UNDER your hierarchy." 
                        : "You are requesting to join UNDER their hierarchy."}
                </p>
                {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
            </div>
        </div>
    );

    const content = (
        <div className="space-y-4">
            {/* Tabs Header */}
            <div className="flex border-b">
                <button
                    type="button"
                    onClick={() => setInviteMethod('code')}
                    className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                        inviteMethod === 'code' 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Invite by Code
                </button>
                <button
                    type="button"
                    onClick={() => setInviteMethod('link')}
                    className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                        inviteMethod === 'link' 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Invite by Link
                </button>
            </div>

            {commonFields}

            {inviteMethod === 'code' ? (
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="grid gap-2">
                        <Label htmlFor="invite-code">Invite Code</Label>
                        <div className="relative">
                            <Input 
                                id="invite-code" 
                                placeholder="10-character code" 
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                maxLength={10}
                                className="font-mono uppercase pl-9"
                            />
                            <div className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none">
                                <Key className="h-4 w-4" />
                            </div>
                        </div>
                        {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                    </div>
                    
                    <Button type="submit" disabled={processing} className="w-full">
                        {processing ? 'Sending...' : 'Send Invitation'}
                    </Button>
                </form>
            ) : (
                <div className="space-y-4 pt-2">
                    <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                        <p>Generate a unique link to share with the other organization. When they accept, the connection will be established.</p>
                    </div>

                    {errorMessage && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}

                    {!generatedLink ? (
                        <Button 
                            type="button" 
                            onClick={handleGenerateLink} 
                            disabled={isGeneratingLink || !data.organization_id} 
                            className="w-full"
                        >
                            {isGeneratingLink ? 'Generating Link...' : 'Generate Invite Link'}
                        </Button>
                    ) : (
                        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                            <Label>Invitation Link</Label>
                            <div className="flex gap-2">
                                <Input 
                                    readOnly 
                                    value={generatedLink} 
                                    className="font-mono text-xs"
                                />
                                <Button size="icon" variant="outline" onClick={copyLink} className="shrink-0">
                                    {linkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                This link expires in 7 days. Anyone with this link can accept the invitation.
                            </p>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setGeneratedLink(null)} 
                                className="w-full text-xs h-7"
                            >
                                Generate New Link
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    if (className === "no-card") {
        return <div className="py-2">{content}</div>;
    }

    return (
        <Card className={`h-full ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Connect Organization
                </CardTitle>
                <CardDescription>
                    Connect with another organization using a code or link.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {content}
            </CardContent>
        </Card>
    );
};

// Simple Tabs Implementation for this page
const TabButton = ({ active, onClick, children, icon: Icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon?: any }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
        }`}
    >
        {Icon && <Icon className="h-4 w-4" />}
        {children}
    </button>
);

interface Employee {
    id: number;
    name: string;
    email: string;
    role: string;
    organization_id: number;
    organization?: Organization;
    manager_id: number | null;
    manager?: Employee;
    directReports?: Employee[];
    deleted_at: string | null;
}

interface Organization {
    id: number;
    user_id: number;
    name: string;
    code?: string;
    parent_id: number | null;
    parent?: Organization;
    children?: Organization[];
    employees?: Employee[];
    employees_count?: number;
    deleted_at: string | null;
    is_pending?: boolean;
    is_pending_confirmation?: boolean;
    is_waiting_sender_confirmation?: boolean;
}

interface OrganizationInvitation {
    id: number;
    sender_org_id: number;
    receiver_org_id: number;
    type: 'parent' | 'subsidiary';
    status: 'pending' | 'accepted' | 'declined' | 'confirmed';
    created_at: string;
    updated_at: string;
    sender: Organization;
    receiver: Organization;
}

interface PageProps {
    organizations: Organization[];
    pendingInvitations: OrganizationInvitation[];
    pendingConfirmations: OrganizationInvitation[];
    sentPendingInvitations: OrganizationInvitation[];
    acceptedInvitations: OrganizationInvitation[];
    availableRoles: string[];
    flash: { success?: string; error?: string };
    auth: {
        user: {
            id: number;
        };
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Organization',
        href: '/organization',
    },
];

// Reusable Combobox for Roles - Imported from @/components/role-combobox

// Recursive Component for Employee Hierarchy Chart
const EmployeeHierarchyNode = ({ employee, onSelect, currentEmployeeId, isParentOrg }: { employee: Employee; onSelect: (employee: Employee) => void; currentEmployeeId?: number; isParentOrg?: boolean }) => {
    const hasChildren = employee.directReports && employee.directReports.length > 0;
    const isCurrent = employee.id === currentEmployeeId;
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapse = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCollapsed(!collapsed);
    };

    return (
        <div className="flex flex-col items-center">
            <div 
                onClick={() => onSelect(employee)}
                className={`
                flex flex-col items-center justify-center p-4 rounded-lg border-2 shadow-sm min-w-[220px] z-10 bg-card transition-all hover:shadow-md cursor-pointer hover:scale-105 relative
                ${isCurrent 
                    ? (isParentOrg 
                        ? 'border-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900' 
                        : 'border-blue-600 bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-slate-900')
                    : `border-border ${isParentOrg ? 'hover:border-emerald-300' : 'hover:border-blue-300'}`
                }
            `}>
                <div className="font-bold text-base flex items-center gap-2 text-center">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    {employee.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {employee.role}
                </div>
                 <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {employee.email}
                </div>
                
                {hasChildren && !collapsed && (
                    <Badge variant="outline" className={`mt-2 text-[10px] h-5 ${isParentOrg 
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' 
                        : 'border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'}`}>
                        {employee.directReports?.length} Reports
                    </Badge>
                )}

                {/* Collapsed State: Show List of Reports inside card */}
                {hasChildren && collapsed && (
                    <div className="mt-3 w-full border-t pt-2 space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider text-center">Direct Reports</div>
                        {employee.directReports!.map(child => (
                            <div 
                                key={child.id} 
                                onClick={(e) => { e.stopPropagation(); onSelect(child); }}
                                className={`flex items-center justify-between p-1.5 rounded hover:bg-muted/50 cursor-pointer transition-colors text-sm group`}
                            >
                                <span className={`font-medium truncate ${isParentOrg ? 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>{child.name}</span>
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{child.directReports?.length || 0}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Collapse/Expand Button */}
                {hasChildren && (
                    <button 
                        onClick={toggleCollapse}
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors z-20"
                        title={collapsed ? "Expand to Tree" : "Collapse to List"}
                    >
                        {collapsed ? <Plus className="h-3 w-3 text-muted-foreground" /> : <Minus className="h-3 w-3 text-muted-foreground" />}
                    </button>
                )}
            </div>

            {hasChildren && !collapsed && (
                    <>
                        {/* Vertical line from parent down */}
                        <div className="h-8 w-[2px] bg-slate-300 dark:bg-slate-600"></div>
                        
                        <div className="flex gap-8 relative pt-4">
                            {/* Connector Lines Logic */}
                            {employee.directReports!.map((child, index, arr) => (
                                <div key={child.id} className="flex flex-col items-center relative">
                                    {/* Top Connector Lines */}
                                    <div className="absolute -top-4 w-full h-4">
                                        {/* Left half line */}
                                        {index > 0 && (
                                            <div className="absolute top-0 right-[50%] w-[calc(50%+1rem)] h-[2px] bg-slate-300 dark:bg-slate-600"></div>
                                        )}
                                        {/* Right half line */}
                                        {index < arr.length - 1 && (
                                            <div className="absolute top-0 left-[50%] w-[calc(50%+1rem)] h-[2px] bg-slate-300 dark:bg-slate-600"></div>
                                        )}
                                        {/* Vertical line down to node */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[2px] bg-slate-300 dark:bg-slate-600"></div>
                                    </div>

                                    <EmployeeHierarchyNode employee={child} onSelect={onSelect} currentEmployeeId={currentEmployeeId} isParentOrg={isParentOrg} />
                                </div>
                            ))}
                        </div>
                    </>
                )}
        </div>
    );
};

// Recursive Component for Organization Hierarchy Chart
const HierarchyNode = ({ organization, onSelect, currentOrganizationId }: { organization: Organization; onSelect: (organization: Organization) => void; currentOrganizationId?: number }) => {
    const hasChildren = organization.children && organization.children.length > 0;
    const isCurrent = organization.id === currentOrganizationId;
    const isJobgiga = organization.name.toLowerCase() === 'jobgiga';
    const isParent = !organization.parent_id;
    const isPending = organization.is_pending;
    const isPendingConfirmation = organization.is_pending_confirmation;
    const isWaitingConfirmation = organization.is_waiting_sender_confirmation;
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapse = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCollapsed(!collapsed);
    };

    return (
        <div className="flex flex-col items-center">
            <div 
                onClick={() => !isPending && !isPendingConfirmation && !isWaitingConfirmation && onSelect(organization)}
                className={`
                flex flex-col items-center justify-center p-4 rounded-lg border-2 shadow-sm min-w-[180px] z-10 bg-card transition-all relative
                ${!isPending && !isPendingConfirmation && !isWaitingConfirmation ? 'hover:shadow-md cursor-pointer hover:scale-105' : 'cursor-default opacity-90'}
                ${isCurrent 
                    ? 'ring-2 ring-offset-2 dark:ring-offset-slate-900'
                    : ''
                }
                ${isPending || isPendingConfirmation || isWaitingConfirmation
                    ? 'border-slate-300 bg-slate-50 dark:bg-slate-900/40 dark:border-slate-700 border-dashed'
                    : isParent
                        ? isCurrent 
                            ? 'border-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 ring-emerald-400' 
                            : 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:border-emerald-500'
                        : isCurrent
                            ? 'border-blue-600 bg-blue-100 dark:bg-blue-900/40 ring-blue-400'
                            : 'border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 hover:border-blue-300 hover:bg-blue-50'
                }
            `}>
                {isPending && (
                     <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-slate-500 text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        PENDING
                     </div>
                )}
                {isPendingConfirmation && (
                     <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-slate-500 text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        READY
                     </div>
                )}
                {isWaitingConfirmation && (
                     <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-slate-500 text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        WAITING
                     </div>
                )}

                <div className="font-bold text-lg flex items-center gap-2 text-center">
                    {isPending || isPendingConfirmation || isWaitingConfirmation ? (
                        <Building className="h-5 w-5 text-slate-400 shrink-0" />
                    ) : (
                        isParent 
                            ? <Building2 className="h-5 w-5 text-emerald-600 shrink-0" /> 
                            : <Building className="h-5 w-5 text-blue-600 shrink-0" />
                    )}
                    {organization.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    {organization.employees_count || 0} Employees
                </div>
                {hasChildren && !collapsed && (
                    <Badge variant="outline" className="mt-2 text-[10px] h-5 border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        {organization.children?.length} Subsidiaries
                    </Badge>
                )}

                {/* Collapsed State: Show List of Subsidiaries inside card */}
                {hasChildren && collapsed && (
                    <div className="mt-3 w-full border-t pt-2 space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider text-center">Subsidiaries</div>
                        {organization.children!.map(child => (
                            <div 
                                key={child.id} 
                                onClick={(e) => { e.stopPropagation(); onSelect(child); }}
                                className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50 cursor-pointer transition-colors text-sm group"
                            >
                                <span className="font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">{child.name}</span>
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{child.employees_count || 0}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Collapse/Expand Button */}
                {hasChildren && (
                    <button 
                        onClick={toggleCollapse}
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors z-20"
                        title={collapsed ? "Expand to Tree" : "Collapse to List"}
                    >
                        {collapsed ? <Plus className="h-3 w-3 text-muted-foreground" /> : <Minus className="h-3 w-3 text-muted-foreground" />}
                    </button>
                )}
            </div>

            {hasChildren && !collapsed && (
                    <>
                        {/* Vertical line from parent down */}
                        <div className="h-8 w-[2px] bg-slate-300 dark:bg-slate-600"></div>
                        
                        <div className="flex gap-8 relative pt-4">
                            {/* Connector Lines Logic:
                                Each child has a vertical line up to meet the horizontal line.
                                The horizontal line connects siblings.
                                We use pseudo-elements or absolute divs on each child to draw the connection to its siblings.
                            */}
                            
                            {organization.children!.map((child, index, arr) => (
                                <div key={child.id} className="flex flex-col items-center relative">
                                    {/* Top Connector Lines */}
                                    <div className="absolute -top-4 w-full h-4">
                                        {/* Left half line (connects to left sibling) */}
                                        {index > 0 && (
                                            <div className="absolute top-0 right-[50%] w-[calc(50%+1rem)] h-[2px] bg-slate-300 dark:bg-slate-600"></div>
                                        )}
                                        {/* Right half line (connects to right sibling) */}
                                        {index < arr.length - 1 && (
                                            <div className="absolute top-0 left-[50%] w-[calc(50%+1rem)] h-[2px] bg-slate-300 dark:bg-slate-600"></div>
                                        )}
                                        {/* Vertical line down to node */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[2px] bg-slate-300 dark:bg-slate-600"></div>
                                    </div>

                                    <HierarchyNode organization={child} onSelect={onSelect} currentOrganizationId={currentOrganizationId} />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            
            {/* Collapsed State: Show List of Subsidiaries - REMOVED, now inside card */}
        </div>
    );
};

export default function Organization() {
    const { organizations, pendingInvitations, pendingConfirmations, sentPendingInvitations, acceptedInvitations, availableRoles, flash, auth } = usePage<any>().props as unknown as PageProps;

    // --- State Definitions (Moved from bottom) ---
    const [focusedOrganizationId, setFocusedOrganizationId] = useState<number | null>(() => {
        // 1. Try to get from localStorage (User Scoped)
        if (typeof window !== 'undefined' && auth?.user?.id) {
            const storageKey = `focusedOrganizationId_${auth.user.id}`;
            const savedId = localStorage.getItem(storageKey);
            if (savedId) {
                const parsedId = parseInt(savedId);
                const found = organizations.find(c => c.id === parsedId && !c.deleted_at);
                if (found) return found.id;
            }
        }

        // 2. Fallback to Jobgiga or first available
        const jobgiga = organizations.find(c => c.name.toLowerCase() === 'jobgiga' && !c.deleted_at);
        return jobgiga ? jobgiga.id : (organizations.length > 0 ? organizations[0].id : null);
    });

    // Persist focus to localStorage (User Scoped)
    useEffect(() => {
        if (focusedOrganizationId && auth?.user?.id) {
            const storageKey = `focusedOrganizationId_${auth.user.id}`;
            localStorage.setItem(storageKey, focusedOrganizationId.toString());
        }
    }, [focusedOrganizationId, auth?.user?.id]);

    const currentOrganization = useMemo(() => 
        organizations.find(c => c.id === focusedOrganizationId), 
        [organizations, focusedOrganizationId]
    );

    const isParentOrg = !currentOrganization?.parent_id;
    const isOwner = currentOrganization?.user_id === auth.user.id;

    // --- Hierarchy Statistics ---
    const hierarchyStats = useMemo(() => {
        if (!currentOrganization) return { grandSubsidiaries: 0, totalOverallEmployees: 0 };

        const getAllDescendantIds = (rootId: number, allOrgs: Organization[], visited: Set<number> = new Set()): number[] => {
            if (visited.has(rootId)) return [];
            visited.add(rootId);

            const children = allOrgs.filter(o => o.parent_id === rootId);
            const childIds = children.map(c => c.id);
            let allDescendants = [...childIds];
            childIds.forEach(childId => {
                allDescendants = [...allDescendants, ...getAllDescendantIds(childId, allOrgs, visited)];
            });
            return allDescendants;
        };

        const allDescendantIds = getAllDescendantIds(currentOrganization.id, organizations);
        const directChildrenCount = organizations.filter(o => o.parent_id === currentOrganization.id).length;
        
        // Grand subsidiaries are total descendants minus direct children
        const grandSubsidiaries = Math.max(0, allDescendantIds.length - directChildrenCount);
        
        // Total overall employees = Current Org Employees + All Descendants Employees
        const currentEmployees = currentOrganization.employees_count || 0;
        const descendantsEmployees = organizations
            .filter(o => allDescendantIds.includes(o.id))
            .reduce((sum, org) => sum + (org.employees_count || 0), 0);
            
        return {
            grandSubsidiaries,
            totalOverallEmployees: currentEmployees + descendantsEmployees
        };
    }, [currentOrganization, organizations]);

    // --- Privacy Logic ---
    // Filter/Process organizations based on privacy logic
    const displayedOrganizations = useMemo(() => {
        if (!currentOrganization) return organizations;
        
        // 1. Identify the "Effective Root"
        // If the current organization has a parent, show the parent as the root.
        // Otherwise, the current organization is the root.
        const directParentId = currentOrganization.parent_id;
        // Use direct parent ID if available, otherwise current organization ID
        const effectiveRootId = directParentId || currentOrganization.id;

        // 2. Helper to find all descendants of a node recursively
        const getDescendantIds = (rootId: number, allOrgs: Organization[], visited: Set<number> = new Set()): number[] => {
            if (visited.has(rootId)) return [];
            visited.add(rootId);

            const children = allOrgs.filter(o => o.parent_id === rootId);
            const childIds = children.map(c => c.id);
            
            let allDescendants = [...childIds];
            childIds.forEach(childId => {
                allDescendants = [...allDescendants, ...getDescendantIds(childId, allOrgs, visited)];
            });
            
            return allDescendants;
        };

        // 3. Determine visible IDs
        // Requirement: Show Current + Current's Descendants + Direct Parent.
        // HIDE siblings (other children of the parent).
        const visibleIds = new Set<number>();
        
        // Always show current and its descendants
        visibleIds.add(currentOrganization.id);
        const myDescendants = getDescendantIds(currentOrganization.id, organizations);
        myDescendants.forEach(id => visibleIds.add(id));
        
        // If there is a parent, show it too (but NOT its other descendants/siblings)
        if (directParentId) {
            visibleIds.add(directParentId);
        }

        const activeOrgs = organizations
            .filter(org => visibleIds.has(org.id))
            .map(org => {
                // Privacy: Disconnect the effective root from its parent (grandparent)
                // This makes the effective root appear as a true root node in the chart.
                if (org.id === effectiveRootId) {
                    return { ...org, parent_id: null, parent: undefined };
                }
                return org;
            });

        // 4. Merge Pending Invitations as "Fake" Organizations
        // This allows them to appear in the directory and hierarchy
        const pendingOrgs = sentPendingInvitations
            ? sentPendingInvitations
                .filter(inv => inv.sender_org_id === currentOrganization.id && inv.status === 'pending')
                .map(inv => {
                    // Determine parent_id based on invitation type
                    // If we invited as subsidiary, WE are the parent.
                    // If we invited as parent, THEY are the parent (root).
                    const isSubsidiaryInvite = inv.type === 'subsidiary';
                    
                    return {
                        ...inv.receiver,
                        // If subsidiary invite, attach to current org. If parent invite, it's a root.
                        parent_id: isSubsidiaryInvite ? currentOrganization.id : null,
                        parent: isSubsidiaryInvite ? currentOrganization : undefined,
                        is_pending: true,
                        // Ensure required fields
                        employees_count: inv.receiver.employees_count || 0,
                        children: [],
                        employees: []
                    } as Organization;
                })
            : [];

        // 5. Merge Pending Confirmations (Accepted by Receiver, Waiting for My Confirmation)
        const confirmationOrgs = pendingConfirmations
            ? pendingConfirmations
                .filter(inv => inv.sender_org_id === currentOrganization.id && inv.status === 'accepted')
                .map(inv => {
                    // Determine parent_id based on invitation type
                    const isSubsidiaryInvite = inv.type === 'subsidiary';
                    
                    return {
                        ...inv.receiver,
                        // If subsidiary invite, attach to current org.
                        parent_id: isSubsidiaryInvite ? currentOrganization.id : null,
                        parent: isSubsidiaryInvite ? currentOrganization : undefined,
                        is_pending_confirmation: true,
                        // Ensure required fields
                        employees_count: inv.receiver.employees_count || 0,
                        children: [],
                        employees: []
                    } as Organization;
                })
            : [];

        // 6. Merge Accepted Invitations (I accepted, Waiting for Sender Confirmation)
        const waitingForSenderOrgs = acceptedInvitations
            ? acceptedInvitations
                .filter(inv => inv.receiver_org_id === currentOrganization.id && inv.status === 'accepted')
                .map(inv => {
                    const otherOrg = inv.sender;
                    // If type='subsidiary', Sender wanted me to be subsidiary -> Sender is Parent.
                    // If type='parent', Sender wanted me to be Parent -> Sender is Subsidiary.
                    const isSenderParent = inv.type === 'subsidiary';

                    return {
                        ...otherOrg,
                        // If sender is parent, they are a root (for now). If sender is child, attach to me.
                        parent_id: isSenderParent ? null : currentOrganization.id,
                        parent: isSenderParent ? undefined : currentOrganization,
                        is_waiting_sender_confirmation: true,
                        employees_count: otherOrg.employees_count || 0,
                        children: [],
                        employees: []
                    } as Organization;
                })
            : [];

        return [...activeOrgs, ...pendingOrgs, ...confirmationOrgs, ...waitingForSenderOrgs]
            .sort((a, b) => {
                const aIsParent = !a.parent_id;
                const bIsParent = !b.parent_id;

                if (aIsParent && !bIsParent) return -1;
                if (!aIsParent && bIsParent) return 1;

                return a.name.localeCompare(b.name);
            });
    }, [organizations, currentOrganization, sentPendingInvitations, pendingConfirmations, acceptedInvitations]);

    // Build hierarchy tree from displayedOrganizations
    const hierarchyData = useMemo(() => {
        const organizationMap = new Map<number, Organization>();
        const roots: Organization[] = [];

        // 1. Initialize map
        displayedOrganizations.forEach(organization => {
            if (!organization.deleted_at) {
                organizationMap.set(organization.id, { ...organization, children: [] });
            }
        });

        // 2. Build relationships
        displayedOrganizations.forEach(organization => {
            if (organization.deleted_at) return;

            const mappedOrganization = organizationMap.get(organization.id);
            if (!mappedOrganization) return;

            if (organization.parent_id && organizationMap.has(organization.parent_id)) {
                const parent = organizationMap.get(organization.parent_id)!;
                
                // Check for cycles: Ensure 'mappedOrganization' is not an ancestor of 'parent'
                let isCycle = false;
                let current = parent;
                const visited = new Set<number>();
                
                while (current && current.parent_id && organizationMap.has(current.parent_id)) {
                    if (current.id === mappedOrganization.id) {
                        isCycle = true;
                        break;
                    }
                    if (visited.has(current.id)) break; // Prevent infinite loop in cycle check itself
                    visited.add(current.id);
                    
                    const nextParent = organizationMap.get(current.parent_id);
                    if (!nextParent) break;
                    current = nextParent;
                }
                // Check one last time for the root of the chain or if loop finished
                if (current && current.id === mappedOrganization.id) {
                    isCycle = true;
                }

                if (!isCycle) {
                    parent.children!.push(mappedOrganization);
                } else {
                    console.warn(`Cycle detected: Organization ${mappedOrganization.name} (${mappedOrganization.id}) cannot be a child of ${parent.name} (${parent.id})`);
                    // Fallback: Add as root to prevent data loss, but break the cycle
                    roots.push(mappedOrganization);
                }
            } else {
                roots.push(mappedOrganization);
            }
        });

        return roots;
    }, [displayedOrganizations]);

    // Add Organization Form
    const { data: addData, setData: setAddData, post: postAdd, processing: addProcessing, errors: addErrors, reset: addReset } = useForm({
        name: '',
        parent_id: 'none',
        subsidiary_id: '',
        modal_type: 'normal',
    });

    // State for Tabs
    const [activeTab, setActiveTab] = useState<'directory' | 'hierarchy' | 'employee-directory' | 'employee-hierarchy'>('directory');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isHierarchyFullscreen, setIsHierarchyFullscreen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to zoom handler
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.5), 2));
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [activeTab, isHierarchyFullscreen]); // Re-bind if tab or mode changes

    // Zoom Tutorial State
    const [showZoomTutorial, setShowZoomTutorial] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('jobgiga-zoom-tutorial-dismissed') !== 'true';
        }
        return true;
    });

    const handleDismissTutorial = () => {
        setShowZoomTutorial(false);
        localStorage.setItem('jobgiga-zoom-tutorial-dismissed', 'true');
    };

    // Employee Directory State
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
    const [selectedEmployeeRole, setSelectedEmployeeRole] = useState<string>('all');
    
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
    const handleZoomReset = () => setZoomLevel(1);

    // State for View Details
    const [viewingOrganization, setViewingOrganization] = useState<Organization | null>(null);
    const [selectedOrganizationForSheet, setSelectedOrganizationForSheet] = useState<Organization | null>(null);

    const openViewModal = (organization: Organization) => {
        setViewingOrganization(organization);
    };

    const closeViewModal = () => {
        setViewingOrganization(null);
    };

    // State for modal type (parent or subsidiary)
    const [modalType, setModalType] = useState<'parent' | 'subsidiary' | 'normal'>('normal');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalTab, setAddModalTab] = useState<'create' | 'connect'>('create');

    const openAddModal = (type: 'parent' | 'subsidiary' | 'normal') => {
        setModalType(type);
        setAddModalTab('create');
        setAddData({
            name: '',
            parent_id: type === 'subsidiary' && currentOrganization ? currentOrganization.id.toString() : 'none',
            subsidiary_id: type === 'parent' && currentOrganization ? currentOrganization.id.toString() : '',
            modal_type: type,
        });
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        addReset();
    };

    const submitAdd: FormEventHandler = (e) => {
        e.preventDefault();
        postAdd('/organization', {
            onSuccess: () => closeAddModal(),
        });
    };

    // Definitions moved to top


    // Employee Data Processing
    // Get unique roles from ALL organizations for the dropdown
    // allUniqueRoles removed in favor of availableRoles prop


    const uniqueRoles = useMemo(() => {
        if (!currentOrganization?.employees) return [];
        const roles = new Set(currentOrganization.employees.map(e => e.role).filter(Boolean));
        return Array.from(roles);
    }, [currentOrganization]);

    const filteredEmployees = useMemo(() => {
        if (!currentOrganization?.employees) return [];
        
        return currentOrganization.employees.filter(employee => {
            const matchesSearch = 
                employee.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                employee.email.toLowerCase().includes(employeeSearchQuery.toLowerCase());
            const matchesRole = selectedEmployeeRole === 'all' || employee.role === selectedEmployeeRole;
            // const notDeleted = !employee.deleted_at; // Allow deleted employees to be shown for restoration

            return matchesSearch && matchesRole;
        });
    }, [currentOrganization, employeeSearchQuery, selectedEmployeeRole]);

    const employeeHierarchyData = useMemo(() => {
        if (!currentOrganization?.employees) return [];
        
        const employeeMap = new Map<number, Employee>();
        const roots: Employee[] = [];
        
        // 1. Initialize map
        currentOrganization.employees.forEach(emp => {
            if (!emp.deleted_at) {
                employeeMap.set(emp.id, { ...emp, directReports: [] });
            }
        });

        // 2. Build relationships
        currentOrganization.employees.forEach(emp => {
            if (emp.deleted_at) return;
            
            const mappedEmp = employeeMap.get(emp.id);
            if (!mappedEmp) return;

            if (emp.manager_id && employeeMap.has(emp.manager_id)) {
                const manager = employeeMap.get(emp.manager_id)!;
                manager.directReports!.push(mappedEmp);
            } else {
                roots.push(mappedEmp);
            }
        });

        return roots;
    }, [currentOrganization]);

    const handleSwitchOrganization = (organization: Organization) => {
        setFocusedOrganizationId(organization.id);
        setActiveTab('directory'); // Optional: switch to directory view to see details
        setViewingOrganization(null); // Close view modal if open
        setSelectedOrganizationForSheet(null); // Close sheet if open
    };

    // Edit Organization State
    const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
    const { data: editData, setData: setEditData, put: putEdit, processing: editProcessing, errors: editErrors, reset: editReset } = useForm({
        name: '',
        parent_id: 'none',
    });

    const openEditModal = (organization: Organization) => {
        setEditingOrganization(organization);
        setEditData({
            name: organization.name,
            parent_id: organization.parent_id ? organization.parent_id.toString() : 'none',
        });
    };

    const closeEditModal = () => {
        setEditingOrganization(null);
        editReset();
    };

    const submitEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingOrganization) {
            putEdit(`/organization/${editingOrganization.id}`, {
                onSuccess: () => closeEditModal(),
            });
        }
    };

    // Delete Organization State
    const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null);

    const deleteOrganization = () => {
        if (deletingOrganization) {
            router.delete(`/organization/${deletingOrganization.id}`, {
                onSuccess: () => setDeletingOrganization(null),
            });
        }
    };

    // Restore Organization State
    const [restoringOrganization, setRestoringOrganization] = useState<Organization | null>(null);

    const restoreOrganization = () => {
        if (restoringOrganization) {
            router.post(`/organization/${restoringOrganization.id}/restore`, {}, {
                onSuccess: () => setRestoringOrganization(null),
            });
        }
    };

    // --- Employee Management State ---

    // Add Employee State
    const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
    const { data: addEmployeeData, setData: setAddEmployeeData, post: postAddEmployee, processing: addEmployeeProcessing, errors: addEmployeeErrors, reset: addEmployeeReset } = useForm({
        name: '',
        email: '',
        role: '',
        organization_id: '',
        manager_id: 'none',
    });

    const openAddEmployeeModal = () => {
        setAddEmployeeData({
            name: '',
            email: '',
            role: '',
            organization_id: currentOrganization ? currentOrganization.id.toString() : '',
            manager_id: 'none',
        });
        setIsAddEmployeeModalOpen(true);
    };

    const closeAddEmployeeModal = () => {
        setIsAddEmployeeModalOpen(false);
        addEmployeeReset();
    };

    const submitAddEmployee: FormEventHandler = (e) => {
        e.preventDefault();
        postAddEmployee('/employee', {
            onSuccess: () => closeAddEmployeeModal(),
        });
    };

    // Edit Employee State
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const { data: editEmployeeData, setData: setEditEmployeeData, put: putEditEmployee, processing: editEmployeeProcessing, errors: editEmployeeErrors, reset: editEmployeeReset } = useForm({
        name: '',
        email: '',
        role: '',
        organization_id: '',
        manager_id: 'none',
    });

    const openEditEmployeeModal = (employee: Employee) => {
        setEditingEmployee(employee);
        setEditEmployeeData({
            name: employee.name,
            email: employee.email,
            role: employee.role,
            organization_id: employee.organization_id.toString(),
            manager_id: employee.manager_id ? employee.manager_id.toString() : 'none',
        });
    };

    const closeEditEmployeeModal = () => {
        setEditingEmployee(null);
        editEmployeeReset();
    };

    const submitEditEmployee: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingEmployee) {
            putEditEmployee(`/employee/${editingEmployee.id}`, {
                onSuccess: () => closeEditEmployeeModal(),
            });
        }
    };

    // Delete Employee State
    const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

    const deleteEmployee = () => {
        if (deletingEmployee) {
            router.delete(`/employee/${deletingEmployee.id}`, {
                onSuccess: () => setDeletingEmployee(null),
            });
        }
    };

    // Restore Employee State
    const [restoringEmployee, setRestoringEmployee] = useState<Employee | null>(null);

    const restoreEmployee = () => {
        if (restoringEmployee) {
            router.post(`/employee/${restoringEmployee.id}/restore`, {}, {
                onSuccess: () => setRestoringEmployee(null),
            });
        }
    };

    // View Employee State
    const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);


    // Use useLayoutEffect to center the chart immediately when switching tabs, preventing visual jump
    useLayoutEffect(() => {
        if ((activeTab === 'hierarchy' || activeTab === 'employee-hierarchy') && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            // Center horizontally immediately
            const scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
            if (scrollLeft > 0) {
                container.scrollLeft = scrollLeft;
            }
        }
    }, [activeTab]);

    const headerContextSwitcher = (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">Company Focus:</span>
            <Select 
                value={focusedOrganizationId?.toString()} 
                onValueChange={(value) => {
                    const organization = organizations.find(c => c.id.toString() === value);
                    if (organization) handleSwitchOrganization(organization);
                }}
            >
                <SelectTrigger className="w-[260px] h-8 text-sm bg-background">
                    <SelectValue placeholder="Select Organization" />
                </SelectTrigger>
                <SelectContent>
                    {displayedOrganizations.filter(c => !c.deleted_at && !c.is_pending && !c.is_pending_confirmation && !c.is_waiting_sender_confirmation).sort((a, b) => {
                                const aIsParent = !a.parent_id;
                                const bIsParent = !b.parent_id;

                                // Parent on top
                                if (aIsParent && !bIsParent) return -1;
                                if (!aIsParent && bIsParent) return 1;

                                // Put Jobgiga first within its group (if any)
                                if (a.name.toLowerCase() === 'jobgiga') return -1;
                                if (b.name.toLowerCase() === 'jobgiga') return 1;

                                return a.name.localeCompare(b.name);
                            }).map(organization => {
                        const isParent = !organization.parent_id;
                        return (
                            <SelectItem key={organization.id} value={organization.id.toString()}>
                                <div className="flex items-center gap-2 min-w-0">
                                    {isParent
                                        ? <Building2 className="h-3 w-3 text-emerald-600 shrink-0" />
                                        : <Building className="h-3 w-3 text-blue-600 shrink-0" />
                                    }
                                    <span className={`truncate ${isParent ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-blue-700 dark:text-blue-400'}`}>
                                        {organization.name}
                                    </span>
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} header={headerContextSwitcher}>
            <Head title="Organization Directory" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 w-full">

                {/* Alerts Section */}
                {flash?.success && (
                    <Alert className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400 items-center">
                        <CheckCircle className="h-4 w-4" />
                        <div className="text-sm">
                            <span className="font-medium mr-2">Success</span>
                            {flash.success}
                        </div>
                    </Alert>
                )}

                {/* Sent Pending Invitations Alert */}
                {sentPendingInvitations && sentPendingInvitations.length > 0 && (
                    <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 items-center">
                        <Clock className="h-4 w-4" />
                        <div className="text-sm">
                            <span className="font-medium mr-2">Pending Invitations Sent:</span>
                            You have sent invitations to: <strong>{sentPendingInvitations.map(i => i.receiver.name).join(', ')}</strong>. Waiting for them to accept.
                        </div>
                    </Alert>
                )}

                {/* Accepted Invitations Waiting for Sender Confirmation Alert */}
                {acceptedInvitations && acceptedInvitations.length > 0 && (
                    <Alert className="border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400 items-center">
                        <Clock className="h-4 w-4" />
                        <div className="text-sm">
                            <span className="font-medium mr-2">Waiting for Sender Confirmation:</span>
                            You have accepted invitations from: <strong>{acceptedInvitations.map(i => i.sender.name).join(', ')}</strong>. Waiting for them to confirm the connection.
                        </div>
                    </Alert>
                )}

                {/* Pending Invitations */}
                {pendingInvitations && pendingInvitations.length > 0 && (
                    <PendingInvitationsList invitations={pendingInvitations} />
                )}

                {/* Pending Confirmations */}
                {pendingConfirmations && pendingConfirmations.length > 0 && (
                    <PendingConfirmationsList invitations={pendingConfirmations} />
                )}

                {/* Current Organization Card Section */}
                {currentOrganization ? (
                    <Card className={`relative overflow-hidden transition-all duration-300 bg-black ${
                        isParentOrg 
                            ? 'border-emerald-800' 
                            : 'border-blue-800'
                    }`}>
                         {/* Background Effects Container */}
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            {/* 1. Flow Field Background - Base Layer */}
                            <NeuralBackground 
                                className="absolute inset-0"
                                backgroundColor="#000000"
                                color={isParentOrg ? "#10b981" : "#3b82f6"} // emerald-500 : blue-500
                                speed={0.8}
                                particleCount={600}
                                trailOpacity={0.4}
                            />
                            
                            {/* 2. Shine Border - Top Layer Effect */}
                            <ShineBorder 
                                className="absolute inset-0" 
                                shineColor={isParentOrg ? ["#10b981", "#34d399", "#6ee7b7"] : ["#2563eb", "#60a5fa", "#93c5fd"]}
                                duration={10}
                                borderWidth={2}
                            />
                        </div>

                        <CardHeader className="pb-3 relative z-10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <Badge className={`mb-2 ${isParentOrg ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>Current Focus</Badge>
                                    <CardTitle className="text-2xl font-bold flex items-center gap-2 text-white flex-wrap">
                                        {isParentOrg ? <Building2 className="h-6 w-6 text-emerald-400 shrink-0" /> : <Building className="h-6 w-6 text-blue-400 shrink-0" />}
                                        <span className="mr-2">{currentOrganization.name}</span>
                                        <InviteCode code={currentOrganization.code} />
                                    </CardTitle>
                                    <CardDescription className="mt-1 text-slate-400">
                                        Manage your organization structure, parents, and subsidiaries.
                                    </CardDescription>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row">

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="inline-block">
                                                    <Button 
                                                        onClick={() => {
                                                            if (currentOrganization.parent) return;
                                                            openAddModal('parent');
                                                        }}
                                                        variant="outline" 
                                                        disabled={!!currentOrganization.parent}
                                                        className={`bg-transparent hover:bg-white/10 ${
                                                            isParentOrg 
                                                                ? 'border-emerald-700 text-emerald-400 hover:text-emerald-300' 
                                                                : 'border-blue-700 text-blue-400 hover:text-blue-300'
                                                        } ${currentOrganization.parent ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                    >
                                                        <Building className="mr-2 h-4 w-4" />
                                                        Add Parent
                                                    </Button>
                                                </div>
                                            </TooltipTrigger>
                                            {currentOrganization.parent && (
                                                <TooltipContent side="bottom" className="max-w-xs text-center">
                                                    <p className="font-semibold">Cannot add parent organization</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        This organization is already a subsidiary of <strong>{currentOrganization.parent.name}</strong>. 
                                                        An organization can only have one direct parent.
                                                    </p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                    <Button 
                                        onClick={() => openAddModal('subsidiary')}
                                        className={isParentOrg ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Subsidiary
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <div className={`rounded-lg bg-slate-900/80 backdrop-blur-sm p-4 shadow-sm border ${isParentOrg ? 'border-emerald-800' : 'border-blue-800'}`}>
                                    <div className="text-sm font-medium text-slate-400 mb-1">Parent Organization</div>
                                    <div className="text-lg font-semibold truncate text-white">
                                        {currentOrganization.parent ? (
                                            <span className="flex items-center gap-2" title={currentOrganization.parent.name}>
                                                <Building className="h-4 w-4 text-slate-400 shrink-0" />
                                                <span className="truncate">{currentOrganization.parent.name}</span>
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 italic">None (Top Level)</span>
                                        )}
                                    </div>
                                </div>
                                <div className={`rounded-lg bg-slate-900/80 backdrop-blur-sm p-4 shadow-sm border ${isParentOrg ? 'border-emerald-800' : 'border-blue-800'}`}>
                                    <div className="text-sm font-medium text-slate-400 mb-1">Direct Subsidiaries</div>
                                    <div className="text-lg font-semibold text-white">
                                        {currentOrganization.children?.length || 0}
                                    </div>
                                </div>
                                <div className={`rounded-lg bg-slate-900/80 backdrop-blur-sm p-4 shadow-sm border ${isParentOrg ? 'border-emerald-800' : 'border-blue-800'}`}>
                                    <div className="text-sm font-medium text-slate-400 mb-1">Grand Subsidiaries</div>
                                    <div className="text-lg font-semibold text-white">
                                        {hierarchyStats.grandSubsidiaries}
                                    </div>
                                </div>
                                <div className={`rounded-lg bg-slate-900/80 backdrop-blur-sm p-4 shadow-sm border ${isParentOrg ? 'border-emerald-800' : 'border-blue-800'}`}>
                                    <div className="text-sm font-medium text-slate-400 mb-1">Direct Employees</div>
                                    <div className="text-lg font-semibold text-white">
                                        {currentOrganization.employees_count || 0}
                                    </div>
                                </div>
                                <div className={`rounded-lg bg-slate-900/80 backdrop-blur-sm p-4 shadow-sm border ${isParentOrg ? 'border-emerald-800' : 'border-blue-800'}`}>
                                    <div className="text-sm font-medium text-slate-400 mb-1">Total Overall Employees</div>
                                    <div className="text-lg font-semibold text-white">
                                        {hierarchyStats.totalOverallEmployees}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>Welcome to Organization Management</CardTitle>
                <CardDescription>
                    {isOwner 
                        ? 'Start by adding your main organization "Jobgiga" to unlock hierarchy features.'
                        : 'You are viewing an organization managed by another user.'}
                </CardDescription>
            </CardHeader>
            {isOwner && (
                <CardFooter>
                     <Button onClick={() => openAddModal('normal')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Organization
                    </Button>
                </CardFooter>
            )}
                    </Card>
                )}

                {/* Tab Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-border mb-2">
                    <div className="flex items-center gap-4">
                        <TabButton 
                            active={activeTab === 'directory'} 
                            onClick={() => setActiveTab('directory')}
                            icon={LayoutList}
                        >
                            Organization Directory
                        </TabButton>
                        <TabButton 
                            active={activeTab === 'hierarchy'} 
                            onClick={() => setActiveTab('hierarchy')}
                            icon={Network}
                        >
                            Organization Hierarchy
                        </TabButton>
                    </div>
                    <div className="h-4 w-[1px] bg-border hidden sm:block"></div>
                    <div className="flex items-center gap-4">
                         <TabButton 
                            active={activeTab === 'employee-directory'} 
                            onClick={() => setActiveTab('employee-directory')}
                            icon={User}
                        >
                            Employee Directory
                        </TabButton>
                        <TabButton 
                            active={activeTab === 'employee-hierarchy'} 
                            onClick={() => setActiveTab('employee-hierarchy')}
                            icon={Network}
                        >
                            Employee Hierarchy
                        </TabButton>
                    </div>
                </div>

                {activeTab === 'directory' && (
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm flex-1">
                        <h2 className="text-lg font-semibold mb-4">Organization Directory</h2>

                        <div className="space-y-2">
                            {displayedOrganizations.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No organizations found.</p>
                            ) : (
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-left">
                                            <tr>
                                                <th className="p-3 font-medium">Organization Name</th>
                                                <th className="p-3 font-medium">Type</th>
                                                <th className="p-3 font-medium">Parent Organization</th>
                                                <th className="p-3 font-medium">Headcount</th>
                                                <th className="p-3 font-medium">Subsidiaries</th>
                                                <th className="p-3 font-medium text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y border-t">
                                            {displayedOrganizations.map(organization => {
                                                const isOwner = organization.user_id === auth.user.id;
                                                return (
                                                <tr
                                                    key={organization.id}
                                                    className={`transition-colors border-l-4 ${
                                                        organization.deleted_at 
                                                            ? 'bg-destructive/5 border-l-destructive' 
                                                            : organization.is_pending || organization.is_pending_confirmation || organization.is_waiting_sender_confirmation
                                                                ? 'bg-slate-50 border-l-slate-300 dark:bg-slate-900/20 dark:border-l-slate-700 opacity-75'
                                                                : !organization.parent_id
                                                                    ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20 border-l-emerald-500'
                                                                    : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 border-l-blue-500'
                                                    }`}
                                                >
                                                    <td className="p-3 font-medium">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={organization.deleted_at ? 'line-through text-muted-foreground' : ''}>
                                                                {organization.name}
                                                            </span>
                                                            {organization.is_pending && (
                                                                 <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                                    PENDING
                                                                </span>
                                                            )}
                                                            {organization.is_pending_confirmation && (
                                                                 <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                                    READY
                                                                </span>
                                                            )}
                                                            {organization.is_waiting_sender_confirmation && (
                                                                 <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                                    WAITING
                                                                </span>
                                                            )}
                                                            <InviteCode code={organization.code} />
                                                            {organization.id === focusedOrganizationId && (
                                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30">
                                                                    Current Focus
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {organization.is_pending ? (
                                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                Invitation Sent
                                                            </span>
                                                        ) : organization.is_pending_confirmation ? (
                                                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                                                                Waiting Confirmation
                                                            </span>
                                                        ) : organization.is_waiting_sender_confirmation ? (
                                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                                Waiting for Sender
                                                            </span>
                                                        ) : organization.parent_id ? (
                                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                                Subsidiary
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                                                                Parent
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">
                                                        <span className={organization.parent?.deleted_at ? 'line-through text-muted-foreground opacity-60' : ''}>
                                                            {organization.parent ? organization.parent.name : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground font-medium">
                                                        <span className={organization.deleted_at ? 'line-through opacity-60' : ''}>
                                                            {organization.employees_count || 0}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {organization.children && organization.children.length > 0
                                                            ? organization.children.map((c, i) => (
                                                                <span key={c.id} className={c.deleted_at ? 'line-through opacity-60' : ''}>
                                                                    {c.name}{i !== organization.children!.length - 1 ? ', ' : ''}
                                                                </span>
                                                            ))
                                                            : '-'}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {organization.deleted_at ? (
                                                                isOwner && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setRestoringOrganization(organization)}
                                                                        className="h-8 gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:hover:bg-emerald-900/40 dark:border-emerald-900"
                                                                    >
                                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                                        <span>Restore</span>
                                                                    </Button>
                                                                )
                                                            ) : organization.is_pending ? (
                                                                 <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled
                                                                    className="h-8 text-muted-foreground"
                                                                >
                                                                    <Clock className="h-4 w-4 mr-1" />
                                                                    <span className="text-xs">Waiting...</span>
                                                                </Button>
                                                            ) : organization.is_pending_confirmation ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled
                                                                    className="h-8 text-emerald-600"
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                                    <span className="text-xs">Waiting for Me</span>
                                                                </Button>
                                                            ) : organization.is_waiting_sender_confirmation ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled
                                                                    className="h-8 text-blue-600"
                                                                >
                                                                    <Clock className="h-4 w-4 mr-1" />
                                                                    <span className="text-xs">Waiting for Sender</span>
                                                                </Button>
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleSwitchOrganization(organization)}
                                                                        className={`h-8 w-8 ${organization.id === focusedOrganizationId ? 'text-blue-600 bg-blue-50' : 'text-muted-foreground hover:text-foreground'}`}
                                                                        title="Manage This Organization"
                                                                    >
                                                                        <Briefcase className="h-4 w-4" />
                                                                        <span className="sr-only">Manage</span>
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => openViewModal(organization)}
                                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                        <span className="sr-only">View Details</span>
                                                                    </Button>
                                                                    {isOwner && (
                                                                        <>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => openEditModal(organization)}
                                                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                            >
                                                                                <Pencil className="h-4 w-4" />
                                                                                <span className="sr-only">Edit</span>
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => setDeletingOrganization(organization)}
                                                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                                <span className="sr-only">Delete</span>
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'hierarchy' && (
                    <div className={`${
                        isHierarchyFullscreen 
                            ? 'fixed inset-0 z-50 bg-background flex flex-col p-6' 
                            : 'rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm flex-1 overflow-hidden relative h-[600px] flex flex-col'
                    }`}>
                        <div className="flex items-center justify-between mb-4 z-20 relative">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                Organization Chart
                                <span className="text-xs font-normal text-muted-foreground ml-2 hidden md:inline-flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">Ctrl</span> + Scroll to Zoom
                                </span>
                            </h2>
                            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm p-1 rounded-lg border shadow-sm">
                                {!isHierarchyFullscreen && (
                                    <>
                                        <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 0.5} className="h-8 w-8">
                                            <ZoomOut className="h-4 w-4" />
                                        </Button>
                                        <span className="text-xs font-medium w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                                        <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 2} className="h-8 w-8">
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                        <div className="w-px h-4 bg-border mx-1"></div>
                                    </>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setIsHierarchyFullscreen(!isHierarchyFullscreen)} 
                                    className="h-8 w-8"
                                    title={isHierarchyFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
                                >
                                    {isHierarchyFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-auto border rounded-lg bg-slate-50 relative bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]" ref={scrollContainerRef}>
                            <div 
                                className="min-w-full min-h-full inline-block p-10 transition-transform duration-200 ease-out origin-top-center"
                                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                            >
                                {hierarchyData.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-muted-foreground text-sm">No hierarchy data available. Add a top-level organization to start.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-16 pb-20">
                                        {hierarchyData.map(rootOrganization => (
                                            <HierarchyNode key={rootOrganization.id} organization={rootOrganization} onSelect={setSelectedOrganizationForSheet} currentOrganizationId={focusedOrganizationId || undefined} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Controls for Fullscreen Mode */}
                        {isHierarchyFullscreen && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-background/90 backdrop-blur shadow-lg border rounded-full px-4 py-2">
                                <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 0.5} className="h-9 w-9 rounded-full hover:bg-muted">
                                    <ZoomOut className="h-5 w-5" />
                                </Button>
                                <span className="text-sm font-medium w-12 text-center select-none">{Math.round(zoomLevel * 100)}%</span>
                                <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 2} className="h-9 w-9 rounded-full hover:bg-muted">
                                    <ZoomIn className="h-5 w-5" />
                                </Button>
                                <div className="w-px h-5 bg-border mx-2"></div>
                                <Button variant="ghost" size="sm" onClick={() => setIsHierarchyFullscreen(false)} className="h-9 px-3 rounded-full hover:bg-muted text-xs uppercase font-bold tracking-wider">
                                    Exit
                                </Button>
                            </div>
                        )}

                        {/* Zoom Tutorial */}
                        {showZoomTutorial && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 max-w-[320px] animate-in zoom-in-95 fade-in duration-500 hidden md:block">
                                <div className="bg-background/95 backdrop-blur border shadow-lg rounded-xl p-4 flex gap-3 items-start relative overflow-hidden ring-1 ring-border/50">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 mt-0.5 dark:bg-blue-900/30 dark:text-blue-400">
                                        <MousePointer2 className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-sm">Quick Zoom</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Hold <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">Ctrl</kbd> + <span className="font-medium text-foreground">Scroll</span> to zoom in and out of the chart smoothly.
                                        </p>
                                        <Button 
                                            variant="link" 
                                            size="sm" 
                                            onClick={handleDismissTutorial}
                                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 mt-1 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Got it, don't show again
                                        </Button>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 absolute top-2 right-2 text-muted-foreground hover:text-foreground" 
                                        onClick={handleDismissTutorial}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'employee-directory' && (
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm flex-1">
                        <div className="flex flex-col gap-4 mb-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Employee Directory</h2>
                                <Button onClick={openAddEmployeeModal} className={`${isParentOrg ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Employee
                                </Button>
                            </div>
                            
                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="relative w-full md:w-[300px]">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search employees..."
                                        value={employeeSearchQuery}
                                        onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                <Select value={selectedEmployeeRole} onValueChange={setSelectedEmployeeRole}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="All Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        {uniqueRoles.map(role => (
                                            <SelectItem key={role} value={role}>{role}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {(employeeSearchQuery || selectedEmployeeRole !== 'all') && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => {
                                            setEmployeeSearchQuery('');
                                            setSelectedEmployeeRole('all');
                                        }}
                                        className="h-9 px-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4 mr-1" /> Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="p-3 font-medium">Employee Name</th>
                                        <th className="p-3 font-medium">Role</th>
                                        <th className="p-3 font-medium">Email</th>
                                        <th className="p-3 font-medium">Manager</th>
                                        <th className="p-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y border-t">
                                    {filteredEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                No employees found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployees.map(employee => (
                                            <tr key={employee.id} className={`transition-colors ${
                                                employee.deleted_at 
                                                    ? 'bg-destructive/5' 
                                                    : 'hover:bg-muted/50'
                                            }`}>
                                                <td className="p-3 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                                        employee.deleted_at
                                                            ? 'bg-muted text-muted-foreground'
                                                            : (isParentOrg 
                                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300')
                                                    }`}>
                                                            {employee.name.charAt(0)}
                                                        </div>
                                                        <span className={employee.deleted_at ? 'line-through text-muted-foreground' : ''}>
                                                            {employee.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant="secondary" className={`font-normal ${employee.deleted_at ? 'opacity-60' : ''}`}>
                                                        {employee.role}
                                                    </Badge>
                                                </td>
                                                <td className={`p-3 text-muted-foreground ${employee.deleted_at ? 'line-through opacity-60' : ''}`}>{employee.email}</td>
                                                <td className={`p-3 text-muted-foreground ${employee.deleted_at ? 'opacity-60' : ''}`}>
                                                    {employee.manager ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <User className="h-3 w-3" />
                                                            {employee.manager.name}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground/50 italic">None</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {employee.deleted_at ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setRestoringEmployee(employee)}
                                                                className="h-8 gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:hover:bg-emerald-900/40 dark:border-emerald-900"
                                                            >
                                                                <RefreshCw className="h-3.5 w-3.5" />
                                                                <span>Restore</span>
                                                            </Button>
                                                        ) : (
                                                            <>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-muted-foreground"
                                                                    onClick={() => setViewingEmployee(employee)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                    onClick={() => openEditEmployeeModal(employee)}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => setDeletingEmployee(employee)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'employee-hierarchy' && (
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm flex-1 overflow-hidden relative h-[600px] flex flex-col">
                        <div className="flex items-center justify-between mb-4 z-20 relative">
                            <h2 className="text-lg font-semibold">Employee Hierarchy</h2>
                            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm p-1 rounded-lg border shadow-sm">
                                <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 0.5} className="h-8 w-8">
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                <span className="text-xs font-medium w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                                <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 2} className="h-8 w-8">
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-auto border rounded-lg bg-slate-50 relative bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]" ref={scrollContainerRef}>
                            <div 
                                className="min-w-full min-h-full inline-block p-10 transition-transform duration-200 ease-out origin-top-center"
                                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                            >
                                {employeeHierarchyData.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-muted-foreground text-sm">No employee hierarchy data available for this organization.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-16 pb-20">
                                        {employeeHierarchyData.map(rootEmployee => (
                                            <EmployeeHierarchyNode 
                                                key={rootEmployee.id} 
                                                employee={rootEmployee} 
                                                onSelect={(emp) => setViewingEmployee(emp)} 
                                                currentEmployeeId={undefined} 
                                                isParentOrg={!currentOrganization?.parent_id}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Zoom Tutorial */}
                        {showZoomTutorial && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 max-w-[320px] animate-in zoom-in-95 fade-in duration-500 hidden md:block">
                                <div className="bg-background/95 backdrop-blur border shadow-lg rounded-xl p-4 flex gap-3 items-start relative overflow-hidden ring-1 ring-border/50">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 mt-0.5 dark:bg-blue-900/30 dark:text-blue-400">
                                        <MousePointer2 className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-sm">Quick Zoom</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Hold <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">Ctrl</kbd> + <span className="font-medium text-foreground">Scroll</span> to zoom in and out of the chart smoothly.
                                        </p>
                                        <Button 
                                            variant="link" 
                                            size="sm" 
                                            onClick={handleDismissTutorial}
                                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 mt-1 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Got it, don't show again
                                        </Button>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 absolute top-2 right-2 text-muted-foreground hover:text-foreground" 
                                        onClick={handleDismissTutorial}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Add Organization Modal */}
                <Dialog open={isAddModalOpen} onOpenChange={(open) => !open && closeAddModal()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {modalType === 'parent' ? 'Add Parent Organization' : 
                                 modalType === 'subsidiary' ? 'Add Subsidiary Organization' : 
                                 'Add New Organization'}
                            </DialogTitle>
                            <DialogDescription>
                                {modalType === 'parent' ? 'Add a parent organization to your hierarchy.' : 
                                 modalType === 'subsidiary' ? `Add a subsidiary under ${currentOrganization?.name}.` : 
                                 'Create a new organization in the directory.'}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Tabs for Parent/Subsidiary */}
                        {(modalType === 'parent' || modalType === 'subsidiary') && (
                            <div className="flex p-1 bg-muted rounded-lg mb-4">
                                <button
                                    type="button"
                                    onClick={() => setAddModalTab('create')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                                        addModalTab === 'create' 
                                            ? 'bg-background text-foreground shadow-sm' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Create New
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAddModalTab('connect')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                                        addModalTab === 'connect' 
                                            ? 'bg-background text-foreground shadow-sm' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Connect Existing
                                </button>
                            </div>
                        )}

                        {addModalTab === 'create' ? (
                            <form onSubmit={submitAdd} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Organization Name</Label>
                                    <Input
                                        type="text"
                                        id="name"
                                        placeholder="Enter organization name"
                                        value={addData.name}
                                        onChange={e => setAddData('name', e.target.value)}
                                    />
                                    {addErrors.name && <span className="text-sm text-destructive">{addErrors.name}</span>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="parent_id">Parent Organization</Label>
                                    <Select
                                        value={addData.parent_id}
                                        onValueChange={(value) => setAddData('parent_id', value)}
                                        disabled={modalType === 'subsidiary'} // Lock parent selection if adding subsidiary
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a parent organization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None (Top-level organization)</SelectItem>
                                            {organizations.map(organization => (
                                                !organization.deleted_at && (
                                                    <SelectItem key={organization.id} value={organization.id.toString()}>
                                                        {organization.name}
                                                    </SelectItem>
                                                )
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {addErrors.parent_id && <span className="text-sm text-destructive">{addErrors.parent_id}</span>}
                                    {modalType === 'parent' && (
                                        <p className="text-xs text-muted-foreground">
                                            Note: This new organization will become the parent of "{currentOrganization?.name}".
                                        </p>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={closeAddModal}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={addProcessing || !addData.name}>
                                        {modalType === 'parent' ? 'Create Parent' : 
                                         modalType === 'subsidiary' ? 'Create Subsidiary' : 
                                         'Create Organization'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        ) : (
                            <div className="pt-1">
                                <div className="mb-4 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900 flex items-start gap-2">
                                    <Key className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                    <span>
                                        Enter the invite code from the existing organization you want to connect as a {modalType === 'parent' ? 'parent' : 'subsidiary'}.
                                    </span>
                                </div>
                                <SendInvitationForm 
                                    organizations={organizations} 
                                    currentOrgId={currentOrganization?.id} 
                                    onSuccess={closeAddModal}
                                    defaultType={modalType === 'parent' || modalType === 'subsidiary' ? modalType : 'subsidiary'}
                                    lockType={true}
                                    className="no-card"
                                />
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* View Organization Details Modal */}
                <Dialog open={!!viewingOrganization} onOpenChange={(open) => !open && closeViewModal()}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                {viewingOrganization?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Detailed information about this organization.
                            </DialogDescription>
                        </DialogHeader>

                        {viewingOrganization && (
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg border p-3 bg-muted/20">
                                        <div className="text-xs font-medium text-muted-foreground mb-1">Organization Type</div>
                                        <div className="text-sm font-semibold">
                                            {viewingOrganization.parent_id ? (
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Subsidiary</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Parent Organization</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border p-3 bg-muted/20">
                                        <div className="text-xs font-medium text-muted-foreground mb-1">Total Employees</div>
                                        <div className="text-sm font-semibold">{viewingOrganization.employees_count || 0}</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 rounded-lg border p-3">
                                        <Building className="h-4 w-4 text-muted-foreground mt-1" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">Parent Organization</div>
                                            <div className="text-sm text-muted-foreground">
                                                {viewingOrganization.parent ? viewingOrganization.parent.name : 'None (Top Level Organization)'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-lg border p-3">
                                        <Network className="h-4 w-4 text-muted-foreground mt-1" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium mb-1">Subsidiary Organizations ({viewingOrganization.children?.length || 0})</div>
                                            {viewingOrganization.children && viewingOrganization.children.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {viewingOrganization.children.map(child => (
                                                        <Badge key={child.id} variant="outline" className="font-normal">
                                                            {child.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground italic">No subsidiary organizations</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeViewModal}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Organization Modal */}
                <Dialog open={!!editingOrganization} onOpenChange={(open) => !open && closeEditModal()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Organization</DialogTitle>
                            <DialogDescription>
                                Make changes to the organization details.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitEdit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Organization Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editData.name}
                                    onChange={(e) => setEditData('name', e.target.value)}
                                    placeholder="Enter organization name"
                                    required
                                />
                                {editErrors.name && <p className="text-sm text-destructive">{editErrors.name}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-parent">Parent Organization</Label>
                                <Select
                                    value={editData.parent_id}
                                    onValueChange={(value) => setEditData('parent_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select parent organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Top Level Organization)</SelectItem>
                                        {organizations
                                            .filter(c => c.id !== editingOrganization?.id && !c.deleted_at) // Prevent selecting self as parent
                                            .map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                {editErrors.parent_id && <p className="text-sm text-destructive">{editErrors.parent_id}</p>}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeEditModal}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={editProcessing}>
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Employee Sheet */}
                <Sheet open={!!selectedOrganizationForSheet} onOpenChange={(open) => !open && setSelectedOrganizationForSheet(null)}>
                    <SheetContent className="overflow-y-auto sm:max-w-md w-full px-4 sm:px-6">
                        <SheetHeader className="pb-4 border-b mb-4">
                    <SheetTitle className="flex items-center gap-2">
                        <Building2 className={`h-5 w-5 ${!selectedOrganizationForSheet?.parent_id ? 'text-emerald-600' : 'text-blue-600'}`} />
                        {selectedOrganizationForSheet?.name} Employees
                    </SheetTitle>
                    <SheetDescription className="flex justify-between items-center mt-2">
                        <span className="text-sm text-muted-foreground">View all employees currently working at {selectedOrganizationForSheet?.name}.</span>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className={`h-7 text-xs gap-1 border shadow-sm ${
                                !selectedOrganizationForSheet?.parent_id 
                                    ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/40' 
                                    : 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40'
                            }`}
                            onClick={() => selectedOrganizationForSheet && handleSwitchOrganization(selectedOrganizationForSheet)}
                        >
                            <Briefcase className="h-3 w-3" />
                            Manage
                        </Button>
                    </SheetDescription>
                </SheetHeader>

                        <div className="space-y-4">
                            {selectedOrganizationForSheet?.employees && selectedOrganizationForSheet.employees.length > 0 ? (
                                <div className="space-y-3 px-1">
                                    {selectedOrganizationForSheet.employees.map((employee) => (
                                        <div 
                                            key={employee.id} 
                                            className={`
                                                flex items-center gap-4 p-4 rounded-xl border shadow-sm transition-all duration-200 
                                                ${!selectedOrganizationForSheet?.parent_id 
                                                    ? 'border-emerald-100 bg-white hover:border-emerald-300 hover:shadow-md dark:bg-slate-950 dark:border-emerald-900/50 dark:hover:border-emerald-800' 
                                                    : 'border-blue-100 bg-white hover:border-blue-300 hover:shadow-md dark:bg-slate-950 dark:border-blue-900/50 dark:hover:border-blue-800'
                                                }
                                            `}
                                        >
                                            <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 shadow-sm border ${
                                                !selectedOrganizationForSheet?.parent_id 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900' 
                                                    : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900'
                                            }`}>
                                                {employee.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-base truncate text-foreground">{employee.name}</div>
                                                <div className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                                                    <Mail className="h-3 w-3" />
                                                    {employee.email}
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Badge variant="secondary" className={`text-[10px] h-5 px-2 font-medium border ${
                                                        !selectedOrganizationForSheet?.parent_id
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                                                            : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                                    }`}>
                                                        {employee.role || 'Employee'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                                    <User className="h-10 w-10 mb-2 opacity-20" />
                                    <p>No employees found for this organization.</p>
                                </div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Delete Organization Warning Modal */}
                <Dialog open={!!deletingOrganization} onOpenChange={(open) => !open && setDeletingOrganization(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Organization</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete <span className="font-semibold text-foreground">{deletingOrganization?.name}</span>?
                                {deletingOrganization && (!deletingOrganization.parent_id) && ' This will also flag its subsidiary organizations.'}
                                This action can be undone later by clicking "Restore".
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDeletingOrganization(null)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={deleteOrganization}
                            >
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Restore Organization Warning Modal */}
                <Dialog open={!!restoringOrganization} onOpenChange={(open) => !open && setRestoringOrganization(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Restore Organization</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to restore <span className="font-semibold text-foreground">{restoringOrganization?.name}</span>?
                                This will make the organization active again.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setRestoringOrganization(null)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={restoreOrganization}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                Restore
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* --- Employee Modals --- */}

                {/* Add Employee Modal */}
                <Dialog open={isAddEmployeeModalOpen} onOpenChange={(open) => !open && closeAddEmployeeModal()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Employee</DialogTitle>
                            <DialogDescription>
                                Add a new employee to {currentOrganization?.name}.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitAddEmployee} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="emp-name">Full Name</Label>
                                <Input
                                    id="emp-name"
                                    value={addEmployeeData.name}
                                    onChange={(e) => setAddEmployeeData('name', e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                                {addEmployeeErrors.name && <p className="text-sm text-destructive">{addEmployeeErrors.name}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="emp-email">Email Address</Label>
                                <Input
                                    id="emp-email"
                                    type="email"
                                    value={addEmployeeData.email}
                                    onChange={(e) => setAddEmployeeData('email', e.target.value)}
                                    placeholder="john@example.com"
                                    required
                                />
                                {addEmployeeErrors.email && <p className="text-sm text-destructive">{addEmployeeErrors.email}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="emp-role">Role / Job Title</Label>
                                <RoleCombobox
                                    id="emp-role"
                                    value={addEmployeeData.role}
                                    onChange={(value) => setAddEmployeeData('role', value)}
                                    options={availableRoles || []}
                                />
                                {addEmployeeErrors.role && <p className="text-sm text-destructive">{addEmployeeErrors.role}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="emp-manager">Manager (Optional)</Label>
                                <Select
                                    value={addEmployeeData.manager_id}
                                    onValueChange={(value) => setAddEmployeeData('manager_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a manager" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Top Level)</SelectItem>
                                        {currentOrganization?.employees?.filter(e => !e.deleted_at).map(emp => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.name} ({emp.role})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {addEmployeeErrors.manager_id && <p className="text-sm text-destructive">{addEmployeeErrors.manager_id}</p>}
                            </div>

                            {/* Hidden Organization ID - locked to current organization */}
                            <input type="hidden" value={addEmployeeData.organization_id} />

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeAddEmployeeModal}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={addEmployeeProcessing}>
                                    Add Employee
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Employee Modal */}
                <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && closeEditEmployeeModal()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Employee</DialogTitle>
                            <DialogDescription>
                                Update employee details.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitEditEmployee} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-emp-name">Full Name</Label>
                                <Input
                                    id="edit-emp-name"
                                    value={editEmployeeData.name}
                                    onChange={(e) => setEditEmployeeData('name', e.target.value)}
                                    required
                                />
                                {editEmployeeErrors.name && <p className="text-sm text-destructive">{editEmployeeErrors.name}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-emp-email">Email Address</Label>
                                <Input
                                    id="edit-emp-email"
                                    type="email"
                                    value={editEmployeeData.email}
                                    onChange={(e) => setEditEmployeeData('email', e.target.value)}
                                    required
                                />
                                {editEmployeeErrors.email && <p className="text-sm text-destructive">{editEmployeeErrors.email}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-emp-role">Role / Job Title</Label>
                                <RoleCombobox
                                    id="edit-emp-role"
                                    value={editEmployeeData.role}
                                    onChange={(value) => setEditEmployeeData('role', value)}
                                    options={availableRoles || []}
                                />
                                {editEmployeeErrors.role && <p className="text-sm text-destructive">{editEmployeeErrors.role}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-emp-organization">Organization</Label>
                                <Select
                                    value={editEmployeeData.organization_id}
                                    onValueChange={(value) => setEditEmployeeData('organization_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizations.filter(c => !c.deleted_at).map(organization => (
                                            <SelectItem key={organization.id} value={organization.id.toString()}>
                                                {organization.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {editEmployeeErrors.organization_id && <p className="text-sm text-destructive">{editEmployeeErrors.organization_id}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-emp-manager">Manager</Label>
                                <Select
                                    value={editEmployeeData.manager_id}
                                    onValueChange={(value) => setEditEmployeeData('manager_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a manager" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Top Level)</SelectItem>
                                        {/* Show employees from the SELECTED organization in the edit form if possible, 
                                            but for simplicity we use currentOrganization's employees or all if we had them. 
                                            Ideally we should fetch employees for the selected organization. 
                                            Since we only have 'currentOrganization' employees easily available in context, 
                                            we might need to be careful if user switches organization. 
                                            For now, let's assume user keeps employee in same organization or we accept the limitation.
                                            Better: use 'organizations' list to find the selected organization's employees if they were loaded.
                                            But 'organizations' props usually don't have all employees loaded for all organizations to save bandwidth?
                                            Actually OrganizationController loads ALL organizations with ALL employees. So we can find them.
                                        */}
                                        {organizations.find(c => c.id.toString() === editEmployeeData.organization_id)?.employees?.filter(e => !e.deleted_at && e.id !== editingEmployee?.id).map(emp => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.name} ({emp.role})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {editEmployeeErrors.manager_id && <p className="text-sm text-destructive">{editEmployeeErrors.manager_id}</p>}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeEditEmployeeModal}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={editEmployeeProcessing}>
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* View Employee Modal */}
                <Dialog open={!!viewingEmployee} onOpenChange={(open) => !open && setViewingEmployee(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                {viewingEmployee?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Employee details and hierarchy.
                            </DialogDescription>
                        </DialogHeader>

                        {viewingEmployee && (
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg border p-3 bg-muted/20">
                                        <div className="text-xs font-medium text-muted-foreground mb-1">Role</div>
                                        <div className="text-sm font-semibold">{viewingEmployee.role}</div>
                                    </div>
                                    <div className="rounded-lg border p-3 bg-muted/20">
                                        <div className="text-xs font-medium text-muted-foreground mb-1">Direct Reports</div>
                                        <div className="text-sm font-semibold">{viewingEmployee.directReports?.length || 0}</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 rounded-lg border p-3">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">Organization</div>
                                            <div className="text-sm text-muted-foreground">
                                                {/* Find organization name if not directly on employee object */}
                                                {viewingEmployee.organization?.name || organizations.find(c => c.id === viewingEmployee.organization_id)?.name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-lg border p-3">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">Manager</div>
                                            <div className="text-sm text-muted-foreground">
                                                {viewingEmployee.manager ? viewingEmployee.manager.name : 'None'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-lg border p-3">
                                        <div className="h-4 w-4 flex items-center justify-center text-muted-foreground">@</div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">Email</div>
                                            <div className="text-sm text-muted-foreground">{viewingEmployee.email}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setViewingEmployee(null)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Employee Warning Modal */}
                <Dialog open={!!deletingEmployee} onOpenChange={(open) => !open && setDeletingEmployee(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Employee</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete <span className="font-semibold text-foreground">{deletingEmployee?.name}</span>?
                                This action can be undone later by clicking "Restore" (if implemented).
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDeletingEmployee(null)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={deleteEmployee}
                            >
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Restore Employee Warning Modal */}
                <Dialog open={!!restoringEmployee} onOpenChange={(open) => !open && setRestoringEmployee(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Restore Employee</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to restore <span className="font-semibold text-foreground">{restoringEmployee?.name}</span>?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setRestoringEmployee(null)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={restoreEmployee}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                Restore
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
