import type { Metadata } from 'next';
import { loadList } from '../_lists/data';
import { ListView } from '../_lists/list-view';

export const metadata: Metadata = { title: 'Дома' };

export default async function PantryPage() {
   const data = await loadList('pantry');
   return <ListView kind="pantry" data={data} />;
}
