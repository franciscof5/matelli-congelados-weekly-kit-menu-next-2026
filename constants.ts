
import { Meal, MealCategory } from './types';

export const MEALS_DATA: Meal[] = [
  // Breakfasts
  {
    id: 'b1',
    name: 'Tapioca de Ovos e Queijo',
    description: 'Tapioca crocante recheada com ovos mexidos cremosos e queijo branco.',
    calories: 280,
    category: MealCategory.BREAKFAST,
    image: 'https://picsum.photos/seed/tap/400/300',
    tags: ['Proteico', 'Sem Glúten'],
    price: 18.90,
    weight: '250g'
  },
  {
    id: 'b2',
    name: 'Omelete de Espinafre',
    description: 'Omelete leve com espinafre fresco e ricota temperada.',
    calories: 210,
    category: MealCategory.BREAKFAST,
    image: 'https://picsum.photos/seed/om/400/300',
    tags: ['Low Carb', 'Vegetariano'],
    price: 16.50,
    weight: '200g'
  },
  {
    id: 'b3',
    name: 'Panqueca de Banana',
    description: 'Panquecas feitas com banana, aveia e um toque de mel.',
    calories: 320,
    category: MealCategory.BREAKFAST,
    image: 'https://picsum.photos/seed/pan/400/300',
    tags: ['Energético', 'Saudável'],
    price: 19.90,
    weight: '220g'
  },

  // Smoothies
  {
    id: 's1',
    name: 'Vitamina de Morango e Chia',
    description: 'Mix refrescante de morangos selecionados, leite vegetal e sementes de chia.',
    calories: 180,
    category: MealCategory.SMOOTHIE,
    image: 'https://picsum.photos/seed/str/400/300',
    tags: ['Fibras', 'Detox'],
    price: 14.90,
    weight: '350ml'
  },
  {
    id: 's2',
    name: 'Tropical Mango',
    description: 'Manga madura batida com água de coco e um toque de gengibre.',
    calories: 150,
    category: MealCategory.SMOOTHIE,
    image: 'https://picsum.photos/seed/man/400/300',
    tags: ['Imunidade', 'Refrescante'],
    price: 15.50,
    weight: '350ml'
  },

  // Lunches
  {
    id: 'l1',
    name: 'Frango Grelhado com Legumes',
    description: 'Peito de frango marinado em ervas finas com mix de legumes ao vapor.',
    calories: 420,
    category: MealCategory.LUNCH,
    image: 'https://picsum.photos/seed/chi/400/300',
    tags: ['Proteico', 'Fitness'],
    price: 28.90,
    weight: '400g'
  },
  {
    id: 'l2',
    name: 'Salmão ao Molho de Maracujá',
    description: 'Filé de salmão grelhado servido com arroz integral e purê de batata doce.',
    calories: 510,
    category: MealCategory.LUNCH,
    image: 'https://picsum.photos/seed/sal/400/300',
    tags: ['Ômega 3', 'Gourmet'],
    price: 34.90,
    weight: '380g'
  },

  // Desserts
  {
    id: 'de1',
    name: 'Mousse de Chocolate 70%',
    description: 'Mousse aerada de chocolate amargo com nibs de cacau.',
    calories: 150,
    category: MealCategory.DESSERT,
    image: 'https://picsum.photos/seed/choc/400/300',
    tags: ['Sem Açúcar', 'Fit'],
    price: 12.00,
    weight: '100g'
  },
  {
    id: 'de2',
    name: 'Pudim de Chia com Coco',
    description: 'Pudim de chia hidratado no leite de coco com calda de frutas vermelhas.',
    calories: 120,
    category: MealCategory.DESSERT,
    image: 'https://picsum.photos/seed/chia/400/300',
    tags: ['Vegano', 'Fibras'],
    price: 11.50,
    weight: '120g'
  },

  // Dinners
  {
    id: 'd1',
    name: 'Sopa de Abóbora Cabotiá',
    description: 'Creme aveludado de abóbora com gengibre e sementes torradas.',
    calories: 190,
    category: MealCategory.DINNER,
    image: 'https://picsum.photos/seed/soup/400/300',
    tags: ['Leve', 'Conforto'],
    price: 22.50,
    weight: '450ml'
  },
  {
    id: 'd2',
    name: 'Quiche de Alho Poró',
    description: 'Massa integral crocante com recheio cremoso de alho poró.',
    calories: 340,
    category: MealCategory.DINNER,
    image: 'https://picsum.photos/seed/quiche/400/300',
    tags: ['Vegetariano'],
    price: 24.90,
    weight: '280g'
  }
];
