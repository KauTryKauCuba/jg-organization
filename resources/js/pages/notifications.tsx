import { Head, router } from '@inertiajs/react';
import { 
    Bell, 
    Check, 
    CheckCheck, 
    UserPlus, 
    CheckCircle, 
    Link as LinkIcon, 
    Handshake,
    AlertCircle,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notifications',
        href: '/notifications',
    },
];

interface Notification {
    id: string;
    type: string;
    data: {
        message: string;
        link?: string;
        invitation_id?: number;
    };
    read_at: string | null;
    created_at: string;
}

interface NotificationsProps {
    notifications: {
        data: Notification[];
        links: any[];
        meta: any;
    };
}

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return "just now";
}

const getNotificationConfig = (type: string) => {
    switch (type) {
        case 'App\\Notifications\\OrganizationInvitationReceived':
            return {
                icon: UserPlus,
                colorClass: 'text-blue-600 dark:text-blue-400',
                bgClass: 'bg-blue-100 dark:bg-blue-900/20',
                borderClass: 'border-blue-200 dark:border-blue-800'
            };
        case 'App\\Notifications\\OrganizationInvitationAccepted':
            return {
                icon: CheckCircle,
                colorClass: 'text-emerald-600 dark:text-emerald-400',
                bgClass: 'bg-emerald-100 dark:bg-emerald-900/20',
                borderClass: 'border-emerald-200 dark:border-emerald-800'
            };
        case 'App\\Notifications\\OrganizationConnectionConfirmed':
            return {
                icon: Handshake,
                colorClass: 'text-indigo-600 dark:text-indigo-400',
                bgClass: 'bg-indigo-100 dark:bg-indigo-900/20',
                borderClass: 'border-indigo-200 dark:border-indigo-800'
            };
        default:
            return {
                icon: Bell,
                colorClass: 'text-primary',
                bgClass: 'bg-primary/10',
                borderClass: 'border-transparent'
            };
    }
};

export default function Notifications({ notifications }: NotificationsProps) {
    const handleMarkAsRead = (id: string) => {
        router.post(`/notifications/${id}/read`, {}, {
            preserveScroll: true,
        });
    };

    const handleMarkAllAsRead = () => {
        router.post('/notifications/read-all', {}, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
                        <p className="text-muted-foreground">
                            View and manage your notifications.
                        </p>
                    </div>
                    {notifications.data.length > 0 && notifications.data.some(n => !n.read_at) && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleMarkAllAsRead}
                            className="gap-2"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                {notifications.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center p-8 border rounded-lg bg-muted/20 border-dashed">
                        <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                            <Bell className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">No notifications yet</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            When you receive notifications, they will appear here. Check back later!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.data.map((notification) => {
                            const config = getNotificationConfig(notification.type);
                            const Icon = config.icon;
                            
                            return (
                                <Card 
                                    key={notification.id} 
                                    className={cn(
                                        "transition-colors",
                                        !notification.read_at 
                                            ? `bg-accent/50 border-l-4 ${config.borderClass}`
                                            : "bg-card"
                                    )}
                                >
                                    <CardContent className="p-4 flex items-start gap-4">
                                        <div className={cn(
                                            "mt-1 p-2 rounded-full shrink-0",
                                            !notification.read_at 
                                                ? `${config.bgClass} ${config.colorClass}` 
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn("text-sm font-medium leading-none", !notification.read_at && "font-semibold")}>
                                                    {notification.data.message}
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {timeAgo(notification.created_at)}
                                                </span>
                                            </div>
                                            {notification.data.link && (
                                                <Button 
                                                    variant="link" 
                                                    className="h-auto p-0 text-xs" 
                                                    onClick={() => router.visit(notification.data.link!)}
                                                >
                                                    View details
                                                </Button>
                                            )}
                                        </div>
                                        {!notification.read_at && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                title="Mark as read"
                                            >
                                                <Check className="h-4 w-4" />
                                                <span className="sr-only">Mark as read</span>
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
