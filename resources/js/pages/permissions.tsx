import { Head, useForm, router } from '@inertiajs/react';
import { Shield, Plus, Pencil, Trash2, Search, Users, Building, Building2 } from 'lucide-react';
import { useState } from 'react';
import NeuralBackground from '@/components/flow-field-background';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShineBorder } from '@/components/ui/shine-border';
import AppLayout from '@/layouts/app-layout';
import * as roleRoutes from '@/routes/roles';
import type { BreadcrumbItem } from '@/types';

interface Permission {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
}

interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions: Permission[];
    users_count?: number;
    created_at: string;
    updated_at: string;
}

interface Organization {
    id: number;
    name: string;
    parent_id: number | null;
    deleted_at: string | null;
}

interface PageProps {
    roles: Role[];
    permissions: Permission[];
    organizations: Organization[];
    currentOrganization: Organization | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles & Permissions',
        href: '/permissions',
    },
];

export default function Permissions({ roles, permissions, organizations, currentOrganization }: PageProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const isParentOrg = currentOrganization ? !currentOrganization.parent_id : false;

    const filteredRoles = roles.filter(role => 
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.permissions.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Form for creating a new role
    const { data: createData, setData: setCreateData, post: createPost, processing: createProcessing, errors: createErrors, reset: createReset } = useForm({
        name: '',
        permissions: [] as string[],
        organization_id: currentOrganization?.id.toString() || '',
    });

    // Form for editing an existing role
    const { data: editData, setData: setEditData, put: editPut, processing: editProcessing, errors: editErrors, reset: editReset } = useForm({
        permissions: [] as string[],
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createPost(roleRoutes.store.url(), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createReset();
            },
        });
    };

    const handleEditClick = (role: Role) => {
        setEditingRole(role);
        setEditData({
            permissions: role.permissions.map((p) => p.name),
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole) return;

        editPut(roleRoutes.update.url({ role: editingRole.id }), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                editReset();
                setEditingRole(null);
            },
        });
    };

    const handleDeleteClick = (role: Role) => {
        if (confirm('Are you sure you want to delete this role?')) {
            router.delete(roleRoutes.destroy.url({ role: role.id }));
        }
    };
    
    // Helper to toggle permission in create form
    const toggleCreatePermission = (permissionName: string) => {
        const current = createData.permissions;
        if (current.includes(permissionName)) {
            setCreateData('permissions', current.filter(p => p !== permissionName));
        } else {
            setCreateData('permissions', [...current, permissionName]);
        }
    };

    // Helper to toggle permission in edit form
    const toggleEditPermission = (permissionName: string) => {
        const current = editData.permissions;
        if (current.includes(permissionName)) {
            setEditData('permissions', current.filter(p => p !== permissionName));
        } else {
            setEditData('permissions', [...current, permissionName]);
        }
    };

    const headerContextSwitcher = (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">Company Focus:</span>
            <Select 
                value={currentOrganization?.id.toString()} 
                onValueChange={(value) => {
                    router.get('/permissions', { organization_id: value });
                }}
            >
                <SelectTrigger className="w-[260px] h-8 text-sm bg-background">
                    <SelectValue placeholder="Select Organization" />
                </SelectTrigger>
                <SelectContent>
                    {organizations && organizations.filter(c => !c.deleted_at).sort((a, b) => {
                        const aIsParent = !a.parent_id;
                        const bIsParent = !b.parent_id;
                        if (aIsParent && !bIsParent) return -1;
                        if (!aIsParent && bIsParent) return 1;
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
            <Head title="Roles & Permissions" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6 w-full">
                
                {/* Header Card with Neural Background */}
                <Card className={`relative overflow-hidden transition-all duration-300 bg-black ${isParentOrg ? 'border-emerald-800' : 'border-blue-800'}`}>
                     <div className="absolute inset-0 z-0 pointer-events-none">
                        <NeuralBackground 
                            className="absolute inset-0"
                            backgroundColor="#000000"
                            color={isParentOrg ? "#10b981" : "#3b82f6"}
                            speed={0.8}
                            particleCount={600}
                            trailOpacity={0.4}
                        />
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
                                <Badge className={`mb-2 ${isParentOrg ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>System Configuration</Badge>
                                <CardTitle className="text-2xl font-bold flex items-center gap-2 text-white">
                                    <Shield className={`h-6 w-6 ${isParentOrg ? 'text-emerald-400' : 'text-blue-400'}`} />
                                    Roles & Permissions
                                </CardTitle>
                                <CardDescription className="mt-1 text-slate-400">
                                    Manage user roles and their associated permissions across the organization.
                                </CardDescription>
                            </div>
                            <Button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg hover:shadow-blue-500/20"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create Role
                            </Button>
                        </div>
                    </CardHeader>
                    

                    
                    <CardContent className="relative z-10">
                         <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
                                <div className="rounded-lg bg-slate-900/80 backdrop-blur-sm p-4 shadow-sm border border-blue-800">
                                    <div className="text-sm font-medium text-slate-400 mb-1">Total Roles</div>
                                    <div className="text-lg font-semibold text-white">{roles.length}</div>
                                </div>
                                <div className="rounded-lg bg-slate-900/80 backdrop-blur-sm p-4 shadow-sm border border-blue-800">
                                    <div className="text-sm font-medium text-slate-400 mb-1">Total Permissions</div>
                                    <div className="text-lg font-semibold text-white">{permissions.length}</div>
                                </div>
                            </div>
                            
                            <div className="w-full md:w-auto relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Search roles..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-slate-900/50 border-blue-800 text-white placeholder:text-slate-500 w-full md:w-[250px]"
                                />
                            </div>
                         </div>
                    </CardContent>
                </Card>

                {/* Roles Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRoles.map((role) => (
                        <Card key={role.id} className="flex flex-col border-2 border-border hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:scale-105">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="capitalize text-blue-700 dark:text-blue-300">{role.name}</span>
                                    <Shield className="h-4 w-4 text-blue-500/50" />
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                        {role.permissions.length} permissions
                                    </Badge>
                                    <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {role.users_count || 0} users
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="flex flex-wrap gap-1">
                                    {role.permissions.slice(0, 5).map((permission) => (
                                        <span key={permission.id} className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20">
                                            {permission.name}
                                        </span>
                                    ))}
                                    {role.permissions.length > 5 && (
                                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-gray-500/10">
                                            +{role.permissions.length - 5} more
                                        </span>
                                    )}
                                    {role.permissions.length === 0 && (
                                        <span className="text-sm text-muted-foreground italic">No permissions assigned</span>
                                    )}
                                </div>
                            </CardContent>
                            <div className="flex items-center justify-end gap-2 p-4 pt-0">
                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(role)} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600">
                                    <Pencil className="mr-2 h-3 w-3" />
                                    Edit Permissions
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(role)} className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Create Role Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Role</DialogTitle>
                            <DialogDescription>
                                Add a new role and assign initial permissions.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Role Name</Label>
                                <Input
                                    id="name"
                                    value={createData.name}
                                    onChange={(e) => setCreateData('name', e.target.value)}
                                    placeholder="e.g., Content Editor"
                                    required
                                />
                                {createErrors.name && <p className="text-sm text-red-500">{createErrors.name}</p>}
                            </div>
                            
                            <div className="grid gap-2">
                                <Label>Permissions</Label>
                                <div className="max-h-[200px] overflow-y-auto rounded-md border p-4">
                                    <div className="grid grid-cols-1 gap-2">
                                        {permissions.map((permission) => (
                                            <div key={permission.id} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`create-perm-${permission.id}`} 
                                                    checked={createData.permissions.includes(permission.name)}
                                                    onCheckedChange={() => toggleCreatePermission(permission.name)}
                                                />
                                                <label
                                                    htmlFor={`create-perm-${permission.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    {permission.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createProcessing} className="bg-blue-600 hover:bg-blue-700">
                                    Create Role
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Role Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
                            <DialogDescription>
                                Update permissions for this role.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Permissions</Label>
                                <div className="max-h-[300px] overflow-y-auto rounded-md border p-4">
                                    <div className="grid grid-cols-1 gap-2">
                                        {permissions.map((permission) => (
                                            <div key={permission.id} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`edit-perm-${permission.id}`} 
                                                    checked={editData.permissions.includes(permission.name)}
                                                    onCheckedChange={() => toggleEditPermission(permission.name)}
                                                />
                                                <label
                                                    htmlFor={`edit-perm-${permission.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    {permission.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={editProcessing} className="bg-blue-600 hover:bg-blue-700">
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
