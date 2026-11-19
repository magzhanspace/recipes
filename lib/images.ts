/** Image URL through our authenticated proxy; `v` busts the cache when Mealie replaces it. */
export function recipeImage(
   recipe: { id?: string | null; image?: string | null },
   size: 'original.webp' | 'min-original.webp' | 'tiny-original.webp' = 'min-original.webp'
): string | null {
   if (!recipe.id || !recipe.image) return null;
   return `/media/recipes/${recipe.id}/${size}?v=${encodeURIComponent(recipe.image)}`;
}
