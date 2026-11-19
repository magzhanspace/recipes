import type { components } from './schema';

type S = components['schemas'];

export type RecipeSummary = S['RecipeSummary'];
export type Recipe = S['RecipeOut'];
export type RecipeIngredient = S['RecipeIngredient-Output'];
export type RecipeStep = S['RecipeStep'];
export type User = S['UserOut-Output'];
export type PlanEntry = S['PlanEntryOut'];
export type PlanEntryType = S['PlanEntryType'];
export type ShoppingList = S['ShoppingListOut'];
export type ShoppingListItem = S['ShoppingListItemOut-Output'];
export type ImageType = S['ImageType'];
