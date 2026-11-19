'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Two people edit the same lists: re-fetch server data when the tab comes back. */
export function RefreshOnFocus() {
   const router = useRouter();
   useEffect(() => {
      let last = Date.now();
      const onVisible = () => {
         if (document.visibilityState === 'visible' && Date.now() - last > 5000) {
            last = Date.now();
            router.refresh();
         }
      };
      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('focus', onVisible);
      return () => {
         document.removeEventListener('visibilitychange', onVisible);
         window.removeEventListener('focus', onVisible);
      };
   }, [router]);
   return null;
}
