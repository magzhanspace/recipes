import { NextResponse, type NextRequest } from 'next/server';
import { getSessionToken, MEALIE_URL } from '@/lib/mealie/client';
import type { ImageType } from '@/lib/mealie/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILES: ReadonlySet<ImageType> = new Set([
   'original.webp',
   'min-original.webp',
   'tiny-original.webp',
]);

/** Recipe images, proxied so Mealie stays private. Signed-in users only. */
export async function GET(
   _request: NextRequest,
   { params }: { params: Promise<{ id: string; file: string }> }
) {
   const token = await getSessionToken();
   if (!token) return new NextResponse(null, { status: 401 });
   const { id, file } = await params;
   if (!UUID.test(id) || !FILES.has(file as ImageType)) {
      return new NextResponse(null, { status: 404 });
   }
   const upstream = await fetch(`${MEALIE_URL}/api/media/recipes/${id}/images/${file}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
   });
   if (!upstream.ok || !upstream.body) {
      return new NextResponse(null, { status: upstream.status === 401 ? 401 : 404 });
   }
   return new NextResponse(upstream.body, {
      headers: {
         'Content-Type': 'image/webp',
         'Cache-Control': 'private, max-age=86400',
      },
   });
}
