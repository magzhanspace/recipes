'use client';

import { BookOpen, CalendarDays, LogOut, Refrigerator, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarGroup,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export const NAV = [
   { href: '/recipes', label: 'Рецепты', icon: BookOpen },
   { href: '/plan', label: 'Меню на неделю', icon: CalendarDays },
   { href: '/shopping', label: 'Покупки', icon: ShoppingCart },
   { href: '/pantry', label: 'Дома', icon: Refrigerator },
] as const;

export function AppSidebar({ userName, household }: { userName: string; household: string }) {
   const pathname = usePathname();
   const { isMobile, setOpenMobile } = useSidebar();
   const close = () => isMobile && setOpenMobile(false);

   return (
      <Sidebar collapsible="offcanvas">
         <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1.5">
               <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  🍲
               </div>
               <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-sm font-semibold truncate">Рецепты</span>
                  <span className="text-xs text-muted-foreground truncate">{household}</span>
               </div>
            </div>
         </SidebarHeader>
         <SidebarContent>
            <SidebarGroup>
               <SidebarMenu>
                  {NAV.map(({ href, label, icon: Icon }) => (
                     <SidebarMenuItem key={href}>
                        <SidebarMenuButton
                           asChild
                           isActive={pathname === href || pathname.startsWith(`${href}/`)}
                        >
                           <Link href={href} onClick={close}>
                              <Icon />
                              <span>{label}</span>
                           </Link>
                        </SidebarMenuButton>
                     </SidebarMenuItem>
                  ))}
               </SidebarMenu>
            </SidebarGroup>
         </SidebarContent>
         <SidebarFooter>
            <div className="flex items-center justify-between gap-2 px-2">
               <span className="text-sm truncate">{userName}</span>
               <div className="flex items-center gap-1">
                  <ThemeToggle />
                  {/* A form, not a Link: prefetching a GET /logout link would sign the user out. */}
                  <form action="/logout" method="post">
                     <button
                        type="submit"
                        className="size-8 inline-flex items-center justify-center rounded-md hover:bg-accent"
                        title="Выйти"
                        aria-label="Выйти"
                     >
                        <LogOut className="size-4" />
                     </button>
                  </form>
               </div>
            </div>
         </SidebarFooter>
      </Sidebar>
   );
}
