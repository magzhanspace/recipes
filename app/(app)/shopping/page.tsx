import type { Metadata } from 'next';
import { loadList } from '../_lists/data';
import { ListView } from '../_lists/list-view';

export const metadata: Metadata = { title: 'Покупки' };

export default async function ShoppingPage() {
   const data = await loadList('shopping');
   return <ListView kind="shopping" data={data} />;
}
