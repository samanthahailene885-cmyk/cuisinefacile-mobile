export type RecipeListItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  time: string;
  calories: string;
  category: string;
  tags: string[];
  ingredients?: Ingredient[];
  preparation_steps?: PreparationStep[];
};

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  price_per_unit?: number;
};

export type PreparationStep = {
  id: string;
  recipe_id: string;
  step_number: number;
  description: string;
};

export type RecipeDetail = RecipeListItem & {
  ingredients: Ingredient[];
  preparation_steps: PreparationStep[];
};
