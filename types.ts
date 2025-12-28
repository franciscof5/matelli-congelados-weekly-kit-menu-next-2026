
export enum MealCategory {
  BREAKFAST = 'Café da Manhã',
  SMOOTHIE = 'Vitamina de Frutas',
  LUNCH = 'Almoço',
  DESSERT = 'Sobremesa',
  DINNER = 'Jantar'
}

export const MEAL_ORDER = [
  MealCategory.BREAKFAST,
  MealCategory.SMOOTHIE,
  MealCategory.LUNCH,
  MealCategory.DESSERT,
  MealCategory.DINNER
];

export const DAYS_OF_WEEK = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo'
];

export interface Meal {
  id: string;
  name: string;
  description: string;
  category: MealCategory;
  image: string;
  tags: string[];
  price: number;
  weight: string;
}

export type DaySelection = {
  [key in MealCategory]?: Meal;
};

export interface SelectionState {
  [day: string]: DaySelection;
}

export interface CartState {
  [mealId: string]: {
    meal: Meal;
    quantity: number;
  };
}
