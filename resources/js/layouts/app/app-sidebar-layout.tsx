import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    header,
    logoHref,
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar logoHref={logoHref} />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs}>
                    {header}
                </AppSidebarHeader>
                {children}
            </AppContent>
        </AppShell>
    );
}
