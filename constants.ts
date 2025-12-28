
import { Meal, MealCategory } from './types';

export const MEALS_DATA: Meal[] = [
  // Breakfasts
  {
    id: 'b1',
    name: 'Tapioca de Ovos e Queijo',
    description: 'Tapioca crocante recheada com ovos mexidos cremosos e queijo branco.',
    category: MealCategory.BREAKFAST,
    image: 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?auto=format&fit=crop&q=80&w=400',
    tags: ['Proteico', 'Sem Glúten'],
    price: 18.90,
    weight: '250g'
  },
  {
    id: 'b2',
    name: 'Omelete de Espinafre',
    description: 'Omelete leve com espinafre fresco e ricota temperada.',
    category: MealCategory.BREAKFAST,
    image: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&q=80&w=400',
    tags: ['Low Carb', 'Vegetariano'],
    price: 16.50,
    weight: '200g'
  },

  // Smoothies
  {
    id: 's1',
    name: 'Vitamina de Morango e Chia',
    description: 'Mix refrescante de morangos selecionados, leite vegetal e sementes de chia.',
    category: MealCategory.SMOOTHIE,
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=400',
    tags: ['Fibras', 'Detox'],
    price: 14.90,
    weight: '350ml'
  },

  // Lunches
  {
    id: 'l1',
    name: 'Frango Grelhado com Legumes',
    description: 'Peito de frango marinado em ervas finas com mix de legumes ao vapor.',
    category: MealCategory.LUNCH,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=400',
    tags: ['Proteico', 'Fitness'],
    price: 28.90,
    weight: '400g'
  },
  {
    id: 'l2',
    name: 'Salmão ao Maracujá',
    description: 'Filé de salmão grelhado servido com arroz integral e purê de batata doce.',
    category: MealCategory.LUNCH,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400',
    tags: ['Ômega 3', 'Gourmet'],
    price: 34.90,
    weight: '380g'
  },

  // Desserts
  {
    id: 'de1',
    name: 'Mousse de Chocolate 70%',
    description: 'Mousse aerada de chocolate amargo com nibs de cacau.',
    category: MealCategory.DESSERT,
    image: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&q=80&w=400',
    tags: ['Sem Açúcar', 'Fit'],
    price: 12.00,
    weight: '100g'
  },

  // Dinners
  {
    id: 'd1',
    name: 'Sopa de Abóbora Cabotiá',
    description: 'Creme aveludado de abóbora com gengibre e sementes torradas.',
    category: MealCategory.DINNER,
    image: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&q=80&w=400',
    tags: ['Leve', 'Conforto'],
    price: 22.50,
    weight: '450ml'
  }
];
