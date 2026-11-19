import { AppSidebar } from '@/components/app/app-sidebar';
import { RefreshOnFocus } from '@/components/app/refresh-on-focus';
import { SidebarProvider } from '@/components/ui/sidebar';
import { mealie, unwrap } from '@/lib/mealie/client';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
   const api = await mealie();
   const me = unwrap(await api.GET('/api/users/self'), 'users/self');

   return (
      <SidebarProvider>
         <RefreshOnFocus />
         <AppSidebar userName={me.fullName || me.username || ''} household={me.household ?? ''} />
         <div className="h-svh overflow-hidden lg:p-2 w-full">
            <div className="lg:border lg:rounded-md overflow-hidden flex flex-col bg-container h-full w-full">
               {children}
            </div>
         </div>
      </SidebarProvider>
   );
}
