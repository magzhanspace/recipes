'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { importRecipe } from './actions';

export function ImportRecipe() {
   const router = useRouter();
   const [open, setOpen] = useState(false);
   const [url, setUrl] = useState('');
   const [error, setError] = useState<string | null>(null);
   const [pending, startTransition] = useTransition();

   function submit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);
      startTransition(async () => {
         const res = await importRecipe(url);
         if (!res.ok) {
            setError(res.error);
            return;
         }
         setOpen(false);
         setUrl('');
         if (res.warnings?.length) {
            toast.warning(`Проверьте рецепт: похоже, есть ${res.warnings.join(' и ')}`, {
               duration: 10000,
            });
         } else {
            toast.success('Рецепт добавлен');
         }
         router.push(`/recipes/${res.slug}`);
      });
   }

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         <DialogTrigger asChild>
            <Button size="xs" variant="secondary">
               <Plus className="size-4" />
               Добавить
            </Button>
         </DialogTrigger>
         <DialogContent className="sm:max-w-md">
            <form onSubmit={submit} className="flex flex-col gap-4">
               <DialogHeader>
                  <DialogTitle>Добавить рецепт по ссылке</DialogTitle>
                  <DialogDescription>
                     Mealie сам заберёт название, ингредиенты, шаги и фото.
                  </DialogDescription>
               </DialogHeader>
               <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                  type="url"
                  inputMode="url"
                  autoFocus
                  required
               />
               {error && <p className="text-sm text-destructive">{error}</p>}
               <DialogFooter>
                  <Button type="submit" disabled={pending || !url}>
                     {pending ? 'Импортируем…' : 'Импортировать'}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
