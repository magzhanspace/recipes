import type { ReactNode } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';

/** Circle-style 40px page header: sidebar toggle, title, optional count and actions. */
export function PageHeader({
   title,
   count,
   children,
}: {
   title: ReactNode;
   count?: number;
   children?: ReactNode;
}) {
   return (
      <div className="w-full flex justify-between items-center gap-2 border-b py-1.5 px-4 sm:px-6 h-10 shrink-0">
         <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger />
            <div className="flex items-center gap-1 min-w-0">
               <span className="text-sm font-medium truncate">{title}</span>
               {count !== undefined && (
                  <span className="text-xs bg-accent rounded-md px-1.5 py-1">{count}</span>
               )}
            </div>
         </div>
         {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
      </div>
   );
}
