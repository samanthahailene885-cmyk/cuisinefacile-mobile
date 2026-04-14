export type RootTabParamList = {
  Home: undefined;
  RecipesTab: undefined;
  Cart: undefined;
  Login: undefined;
  Categories: undefined;
};

export type RootDrawerParamList = {
  Tabs: undefined;
  Notifications: undefined;
  Orders: undefined;
};

export type RecipesStackParamList = {
  Recipes: { initialCategory?: string; focusSearch?: number; initialQuery?: string } | undefined;
  RecipeDetail: { id: string; title?: string };
};

export type CartStackParamList = {
  Cart: undefined;
  Checkout: undefined;
  Success: undefined;
};

export type OrdersStackParamList = {
  Orders: undefined;
  OrderDetail: { order: any };
};
