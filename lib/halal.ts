import type { Recipe, RecipeIngredient } from '@/lib/mealie/types';

/**
 * All recipes in this household must be halal: no pork, no alcohol.
 * Imports from the web can bring in anything, so recipes are checked and
 * flagged (never silently changed). Halal sausages, ham or vinegar exist,
 * so those are left to a human.
 *
 * JS `\b` only knows ASCII letters, so word edges use Unicode lookarounds.
 */
const word = (alternatives: string[]) =>
   new RegExp(`(?<!\\p{L})(?:${alternatives.join('|')})(?!\\p{L})`, 'iu');
const stem = (alternatives: string[]) =>
   new RegExp(`(?<!\\p{L})(?:${alternatives.join('|')})`, 'iu');

const HARAM: { patterns: RegExp[]; label: string }[] = [
   {
      label: 'свинина',
      patterns: [
         stem([
            'свин',
            'бекон',
            'смалец',
            'лярд',
            'прошутто',
            'хамон',
            'панчетт',
            'гуанчал',
            'pork',
            'bacon',
            'prosciutto',
            'pancetta',
            'guanciale',
         ]),
         word(['сало', 'сала', 'салом', 'lard']),
      ],
   },
   {
      label: 'алкоголь',
      patterns: [
         stem([
            'пиво',
            'пива',
            'пивн',
            'коньяк',
            'водк',
            'ликёр',
            'ликер',
            'херес',
            'бренди',
            'виски',
            'мирин',
            'шерри',
            'марсал',
            'портвейн',
            'вермут',
            'кальвадос',
            'текил',
            'шампанск',
            'граппа',
            'абсент',
            'бурбон',
            'liqueur',
            'whisk',
            'vodka',
            'cognac',
            'tequila',
            'bourbon',
            'mirin',
            'sherry',
            'brandy',
         ]),
         word([
            'вино',
            'вина',
            'вином',
            'вине',
            'ром',
            'рома',
            'ромом',
            'джин',
            'саке',
            'wine',
            'wines',
            'beer',
            'rum',
            'gin',
            'sake',
         ]),
      ],
   },
];

/** Halal look-alikes that would otherwise match the lists above. */
const NOT_HARAM =
   /винный уксус|винного уксуса|wine vinegar|ginger beer|имбирное пиво|имбирного пива/giu;

function ingredientText(i: Partial<RecipeIngredient>): string {
   return [i.food?.name, i.note, i.originalText, i.display].filter(Boolean).join(' ');
}

/** Returns the reasons a recipe may not be halal (empty when nothing was found). */
export function halalIssues(recipe: Pick<Recipe, 'name' | 'recipeIngredient'>): string[] {
   const found = new Set<string>();
   const texts = [recipe.name ?? '', ...(recipe.recipeIngredient ?? []).map(ingredientText)];
   for (const text of texts) {
      const cleaned = text.replace(NOT_HARAM, ' ');
      for (const { patterns, label } of HARAM) {
         if (patterns.some((p) => p.test(cleaned))) found.add(label);
      }
   }
   return [...found];
}
