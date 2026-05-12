import { Head, useForm, usePage, router } from '@inertiajs/react';
import { 
    Pencil, Trash2, RefreshCw, Search, Filter, Plus, Minus, 
    User, Briefcase, Building2, Building, LayoutList, Network, X, 
    ZoomIn, ZoomOut, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import type { FormEventHandler} from 'react';
import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import RoleCombobox from '@/components/role-combobox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// Simple Tabs Implementation
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

interface Organization {
    id: number;
    name: string;
    deleted_at: string | null;
}

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

interface Role {
    id: number;
    name: string;
    organization_id: number;
}

interface PageProps {
    employees: Employee[];
    organizations: Organization[];
    availableRoles: Record<string, Role[]>;
    allRoles: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee',
        href: '/employee',
    },
];

// Recursive Component for Hierarchy Chart
const HierarchyNode = ({ employee, onSelect, currentEmployeeId }: { employee: Employee; onSelect: (employee: Employee) => void; currentEmployeeId?: number }) => {
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
                flex flex-col items-center justify-center p-4 rounded-lg border-2 shadow-sm min-w-[200px] z-10 bg-card transition-all hover:shadow-md cursor-pointer hover:scale-105 relative
                ${isCurrent 
                    ? 'border-blue-600 bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-slate-900'
                    : 'border-border hover:border-blue-300'
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
                {employee.organization && (
                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded-full">
                        <Building2 className="h-3 w-3" />
                        {employee.organization.name}
                    </div>
                )}
                
                {hasChildren && !collapsed && (
                    <Badge variant="outline" className="mt-2 text-[10px] h-5 border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
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
                                className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50 cursor-pointer transition-colors text-sm group"
                            >
                                <span className="font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">{child.name}</span>
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

                                    <HierarchyNode employee={child} onSelect={onSelect} currentEmployeeId={currentEmployeeId} />
                                </div>
                            ))}
                        </div>
                    </>
                )}
        </div>
    );
};

export default function Employee() {
    const { employees, organizations, availableRoles, allRoles } = usePage<any>().props as unknown as PageProps;

    // State for Tabs and Filters
    const [activeTab, setActiveTab] = useState<'directory' | 'hierarchy'>('directory');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('all');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [zoomLevel, setZoomLevel] = useState(1);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
    const handleZoomReset = () => setZoomLevel(1);

    // Derived lists for filters
    const uniqueRoles = useMemo(() => {
        const roles = new Set(employees.map(e => e.role));
        return Array.from(roles).sort();
    }, [employees]);

    // Filtered Employees for Directory Table (includes Search and Role)
    const directoryEmployees = useMemo(() => {
        return employees.filter(employee => {
            const matchesSearch = 
                employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                employee.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesOrganization = selectedOrganizationId === 'all' || employee.organization_id.toString() === selectedOrganizationId;
            const matchesRole = selectedRole === 'all' || employee.role === selectedRole;
            const notDeleted = !employee.deleted_at;

            return matchesSearch && matchesOrganization && matchesRole && notDeleted;
        });
    }, [employees, searchQuery, selectedOrganizationId, selectedRole]);

    // Filtered Employees for Hierarchy Chart (only Company filter)
    const hierarchyEmployees = useMemo(() => {
        return employees.filter(employee => {
            const matchesOrganization = selectedOrganizationId === 'all' || employee.organization_id.toString() === selectedOrganizationId;
            const notDeleted = !employee.deleted_at;
            
            return matchesOrganization && notDeleted;
        });
    }, [employees, selectedOrganizationId]);

    // Statistics Calculation
    const stats = useMemo(() => {
        const totalEmployees = directoryEmployees.length;
        const totalManagers = directoryEmployees.filter(e => directoryEmployees.some(sub => sub.manager_id === e.id)).length;
        const currentOrganization = organizations.find(c => c.id.toString() === selectedOrganizationId);
        
        return {
            totalEmployees,
            totalManagers,
            organizationName: currentOrganization ? currentOrganization.name : 'All Organizations'
        };
    }, [directoryEmployees, selectedOrganizationId, organizations]);



    // Build hierarchy tree from hierarchy list
    const hierarchyData = useMemo(() => {
        const employeeMap = new Map<number, Employee>();
        const roots: Employee[] = [];

        // 1. Initialize map
        hierarchyEmployees.forEach(employee => {
            employeeMap.set(employee.id, { ...employee, directReports: [] });
        });

        // 2. Build relationships
        hierarchyEmployees.forEach(employee => {
            const mappedEmployee = employeeMap.get(employee.id);
            if (!mappedEmployee) return;

            if (employee.manager_id && employeeMap.has(employee.manager_id)) {
                const manager = employeeMap.get(employee.manager_id)!;
                manager.directReports!.push(mappedEmployee);
            } else {
                // If no manager or manager is filtered out, treat as root for this view
                roots.push(mappedEmployee);
            }
        });

        return roots;
    }, [hierarchyEmployees]);

    // Add Employee Form
    const { data: addData, setData: setAddData, post: postAdd, processing: addProcessing, errors: addErrors, reset: addReset } = useForm({
        name: '',
        email: '',
        role: '',
        organization_id: '',
        manager_id: 'none',
    });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const openAddModal = () => {
        setAddData({
            name: '',
            email: '',
            role: '',
            organization_id: '',
            manager_id: 'none',
        });
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        addReset();
    };

    const submitAdd: FormEventHandler = (e) => {
        e.preventDefault();
        postAdd('/employee', {
            onSuccess: () => closeAddModal(),
        });
    };

    // View Employee State
    const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

    // Edit Employee State
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const { data: editData, setData: setEditData, put: putEdit, processing: editProcessing, errors: editErrors, reset: editReset } = useForm({
        name: '',
        email: '',
        role: '',
        organization_id: '',
        manager_id: 'none',
    });

    const openEditModal = (employee: Employee) => {
        setEditingEmployee(employee);
        setEditData({
            name: employee.name,
            email: employee.email,
            role: employee.role,
            organization_id: employee.organization_id.toString(),
            manager_id: employee.manager_id ? employee.manager_id.toString() : 'none',
        });
    };

    const closeEditModal = () => {
        setEditingEmployee(null);
        editReset();
    };

    const submitEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingEmployee) {
            putEdit(`/employee/${editingEmployee.id}`, {
                onSuccess: () => closeEditModal(),
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

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Center hierarchy on switch
    useLayoutEffect(() => {
        if (activeTab === 'hierarchy' && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
            if (scrollLeft > 0) {
                container.scrollLeft = scrollLeft;
            }
        }
    }, [activeTab]);

    const headerContextSwitcher = (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">Filter Organization:</span>
            <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
                <SelectTrigger className="w-[200px] h-8 text-sm bg-background">
                    <SelectValue placeholder="All Organizations" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.filter(c => !c.deleted_at).map(organization => (
                        <SelectItem key={organization.id} value={organization.id.toString()}>
                            <div className="flex items-center gap-2">
                                {organization.name.toLowerCase() === 'jobgiga' ? <Building2 className="h-3 w-3 text-blue-600" /> : <Building className="h-3 w-3" />}
                                <span>{organization.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} header={headerContextSwitcher}>
            <Head title="Employee Directory" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 w-full">
                
                {/* Summary Card */}
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 transition-all duration-300">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <Badge className="mb-2 bg-blue-600 hover:bg-blue-700">Directory Overview</Badge>
                                <CardTitle className="text-2xl font-bold text-blue-950 dark:text-blue-100 flex items-center gap-2">
                                    <User className="h-6 w-6" />
                                    {stats.organizationName} Employees
                                </CardTitle>
                                <CardDescription className="text-blue-700 dark:text-blue-300 mt-1">
                                    Manage your team members, roles, and reporting lines.
                                </CardDescription>
                            </div>
                            <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Employee
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-lg bg-white p-4 shadow-sm border border-blue-100 dark:bg-gray-900 dark:border-gray-800">
                                <div className="text-sm font-medium text-muted-foreground mb-1">Total Employees</div>
                                <div className="text-lg font-semibold">{stats.totalEmployees}</div>
                            </div>
                            <div className="rounded-lg bg-white p-4 shadow-sm border border-blue-100 dark:bg-gray-900 dark:border-gray-800">
                                <div className="text-sm font-medium text-muted-foreground mb-1">Managers</div>
                                <div className="text-lg font-semibold">{stats.totalManagers}</div>
                            </div>
                            <div className="rounded-lg bg-white p-4 shadow-sm border border-blue-100 dark:bg-gray-900 dark:border-gray-800">
                                <div className="text-sm font-medium text-muted-foreground mb-1">Roles</div>
                                <div className="text-lg font-semibold">{uniqueRoles.length}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-border mb-2">
                    <TabButton active={activeTab === 'directory'} onClick={() => setActiveTab('directory')} icon={LayoutList}>
                        Directory
                    </TabButton>
                    <TabButton active={activeTab === 'hierarchy'} onClick={() => setActiveTab('hierarchy')} icon={Network}>
                        Hierarchy
                    </TabButton>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'directory' ? (
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm flex-1">
                            <div className="flex flex-col gap-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">Employee Directory</h2>
                                </div>
                                
                                {/* Filters */}
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="relative w-full md:w-[300px]">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search employees..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
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
                                    {(searchQuery || selectedRole !== 'all') && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSelectedRole('all');
                                            }}
                                            className="h-9 px-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4 mr-1" /> Clear
                                        </Button>
                                    )}
                                </div>
                            </div>
                            
                            {directoryEmployees.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                    <p>No employees found matching your filters.</p>
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-left">
                                            <tr>
                                                <th className="p-3 font-medium">Name</th>
                                                <th className="p-3 font-medium">Role</th>
                                                <th className="p-3 font-medium">Organization</th>
                                                <th className="p-3 font-medium">Manager</th>
                                                <th className="p-3 font-medium text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y border-t">
                                            {directoryEmployees.map(employee => (
                                                <tr
                                                    key={employee.id}
                                                    className={`transition-colors ${employee.deleted_at ? 'bg-destructive/5' : 'hover:bg-muted/50'}`}
                                                >
                                                    <td className="p-3">
                                                        <div className="font-medium">{employee.name}</div>
                                                        <div className="text-xs text-muted-foreground">{employee.email}</div>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">
                                                        <Badge variant="secondary" className="font-normal">{employee.role}</Badge>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {employee.organization ? employee.organization.name : '-'}
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {employee.manager ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <User className="h-3 w-3" />
                                                                {employee.manager.name}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs italic opacity-50">No Manager</span>
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
                                                                        <span className="sr-only">View</span>
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                        onClick={() => openEditModal(employee)}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                        <span className="sr-only">Edit</span>
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                        onClick={() => setDeletingEmployee(employee)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        <span className="sr-only">Delete</span>
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm flex-1 overflow-hidden relative h-[600px] flex flex-col">
                            <div className="flex items-center justify-between mb-4 z-20 relative">
                                <h2 className="text-lg font-semibold">Organization Chart</h2>
                                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm p-1 rounded-lg border shadow-sm">
                                    <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoomLevel <= 0.5} className="h-8 w-8">
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs font-medium w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                                    <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoomLevel >= 2} className="h-8 w-8">
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <div className="w-px h-4 bg-border mx-1"></div>
                                    <Button variant="ghost" size="sm" onClick={handleZoomReset} className="h-8 text-xs px-2">
                                        Reset
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
                                            <p className="text-muted-foreground text-sm">No hierarchy data available for the current filters.</p>
                                        </div>
                                    ) : (
                                        <div className="flex gap-16 justify-center pb-20">
                                            {hierarchyData.map(root => (
                                                <HierarchyNode 
                                                    key={root.id} 
                                                    employee={root} 
                                                    onSelect={(emp) => setViewingEmployee(emp)} 
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* View Employee Modal */}
                <Dialog open={!!viewingEmployee} onOpenChange={(open) => !open && setViewingEmployee(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                {viewingEmployee?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Employee Details
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
                                        <div className="text-xs font-medium text-muted-foreground mb-1">Email</div>
                                        <div className="text-sm font-semibold truncate" title={viewingEmployee.email}>{viewingEmployee.email}</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 rounded-lg border p-3">
                                        <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">Organization</div>
                                            <div className="text-sm text-muted-foreground">
                                                {viewingEmployee.organization ? viewingEmployee.organization.name : 'Unknown'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-lg border p-3">
                                        <User className="h-4 w-4 text-muted-foreground mt-1" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">Manager</div>
                                            <div className="text-sm text-muted-foreground">
                                                {viewingEmployee.manager ? viewingEmployee.manager.name : 'None (Top Level)'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3 rounded-lg border p-3">
                                        <Network className="h-4 w-4 text-muted-foreground mt-1" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium mb-1">Direct Reports ({viewingEmployee.directReports?.length || 0})</div>
                                            {viewingEmployee.directReports && viewingEmployee.directReports.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {viewingEmployee.directReports.map(report => (
                                                        <Badge key={report.id} variant="secondary" className="font-normal text-xs">
                                                            {report.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground italic">No direct reports</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="flex sm:justify-between gap-2">
                            <div className="flex gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => {
                                        if (viewingEmployee) {
                                            openEditModal(viewingEmployee);
                                            setViewingEmployee(null);
                                        }
                                    }}
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            </div>
                            <Button type="button" variant="secondary" onClick={() => setViewingEmployee(null)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Modal */}
                <Dialog open={isAddModalOpen} onOpenChange={(open) => !open && closeAddModal()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Employee</DialogTitle>
                            <DialogDescription>Create a new employee profile.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitAdd} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={addData.name} onChange={e => setAddData('name', e.target.value)} placeholder="John Doe" />
                                {addErrors.name && <span className="text-sm text-destructive">{addErrors.name}</span>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={addData.email} onChange={e => setAddData('email', e.target.value)} placeholder="john@example.com" />
                                {addErrors.email && <span className="text-sm text-destructive">{addErrors.email}</span>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="organization">Organization</Label>
                                <Select value={addData.organization_id} onValueChange={(val) => setAddData('organization_id', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Organization..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizations.filter(c => !c.deleted_at).map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {addErrors.organization_id && <span className="text-sm text-destructive">{addErrors.organization_id}</span>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role / Job Title</Label>
                                <RoleCombobox 
                                    id="role"
                                    value={addData.role} 
                                    onChange={(val) => setAddData('role', val)} 
                                    options={allRoles || []}
                                />
                                {addErrors.role && <span className="text-sm text-destructive">{addErrors.role}</span>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="manager">Manager</Label>
                                <Select value={addData.manager_id} onValueChange={(val) => setAddData('manager_id', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Top Level)</SelectItem>
                                        {employees.filter(e => !e.deleted_at && (!addData.organization_id || e.organization_id.toString() === addData.organization_id)).map(e => (
                                            <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {addErrors.manager_id && <span className="text-sm text-destructive">{addErrors.manager_id}</span>}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={closeAddModal}>Cancel</Button>
                                <Button type="submit" disabled={addProcessing}>Save Employee</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && closeEditModal()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Employee</DialogTitle>
                            <DialogDescription>Update details for {editingEmployee?.name}.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input id="edit-name" value={editData.name} onChange={e => setEditData('name', e.target.value)} />
                                {editErrors.name && <span className="text-sm text-destructive">{editErrors.name}</span>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input id="edit-email" type="email" value={editData.email} onChange={e => setEditData('email', e.target.value)} />
                                {editErrors.email && <span className="text-sm text-destructive">{editErrors.email}</span>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-organization">Organization</Label>
                                <Select value={editData.organization_id} onValueChange={(val) => setEditData('organization_id', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizations.filter(c => !c.deleted_at).map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {editErrors.organization_id && <span className="text-sm text-destructive">{editErrors.organization_id}</span>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-role">Role / Job Title</Label>
                                <Select value={editData.role} onValueChange={(val) => setEditData('role', val)} disabled={!editData.organization_id}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Role / Job Title" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {editData.organization_id && availableRoles[editData.organization_id]?.map((role) => (
                                            <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {editErrors.role && <span className="text-sm text-destructive">{editErrors.role}</span>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-manager">Manager</Label>
                                <Select value={editData.manager_id} onValueChange={(val) => setEditData('manager_id', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Top Level)</SelectItem>
                                        {employees.filter(e => !e.deleted_at && e.id !== editingEmployee?.id && (!editData.organization_id || e.organization_id.toString() === editData.organization_id)).map(e => (
                                            <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {editErrors.manager_id && <span className="text-sm text-destructive">{editErrors.manager_id}</span>}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={closeEditModal}>Cancel</Button>
                                <Button type="submit" disabled={editProcessing}>Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!deletingEmployee} onOpenChange={(open) => !open && setDeletingEmployee(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Employee</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete {deletingEmployee?.name}? This action can be undone later.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="secondary" onClick={() => setDeletingEmployee(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={deleteEmployee}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Restore Confirmation Dialog */}
                <Dialog open={!!restoringEmployee} onOpenChange={(open) => !open && setRestoringEmployee(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Restore Employee</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to restore {restoringEmployee?.name}?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="secondary" onClick={() => setRestoringEmployee(null)}>
                                Cancel
                            </Button>
                            <Button onClick={restoreEmployee} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                Restore
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </AppLayout>
    );
}
