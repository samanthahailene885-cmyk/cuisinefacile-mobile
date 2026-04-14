import type { ImageSourcePropType } from 'react-native';

import { RECIPE_IMAGES } from './recipeImages';

const img1 = require('../assets/img1.jpg');
const img2 = require('../assets/img2.jpg');
const img3 = require('../assets/img3.png');
const fallbackLogo = require('../assets/logo.png');

const pickLocalPlaceholder = (recipeId: string): ImageSourcePropType => {
  const id = String(recipeId || '').trim();
  if (!id) return fallbackLogo;

  const digits = id.replace(/\D/g, '');
  const n = digits ? Number.parseInt(digits.slice(-6), 10) : id.length;
  const idx = Number.isFinite(n) ? n % 3 : 0;

  if (idx === 1) return img2;
  if (idx === 2) return img3;
  return img1;
};

const pickLocalRecipeImage = (recipeId: string): ImageSourcePropType | null => {
  const id = String(recipeId || '').trim();
  if (!id) return null;
  const src = (RECIPE_IMAGES as any)?.[id];
  return src ? (src as ImageSourcePropType) : null;
};

const shouldUseLocalAsset = (imageUrl: string): boolean => {
  const raw = String(imageUrl || '').trim().toLowerCase();
  if (!raw) return true;

  return (
    raw.includes('localhost') ||
    raw.includes('127.0.0.1') ||
    raw.includes('/cuisinefacile/') ||
    raw.includes('/php-api/') ||
    raw.includes('/recipes/')
  );
};

export const getRecipeImageSource = (args: {
  recipeId: string;
  image?: string;
  imageFailed?: boolean;
}): ImageSourcePropType => {
  const localRecipe = pickLocalRecipeImage(args.recipeId);
  if (localRecipe) return localRecipe;

  if (args.imageFailed) return pickLocalPlaceholder(args.recipeId);

  const img = String(args.image || '').trim();
  if (!img) return pickLocalPlaceholder(args.recipeId);

  if (shouldUseLocalAsset(img)) {
    return pickLocalPlaceholder(args.recipeId);
  }

  return { uri: img };
};
