// Shared constants for the café application

export interface MenuItem {
  id: number
  name: string
  price: number
  emoji: string
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 1, name: 'Tea', price: 10, emoji: '🍵' },
  { id: 2, name: 'Chukku Kappi', price: 10, emoji: '☕' },
  { id: 3, name: 'Bun Muska', price: 30, emoji: '🍞' },
  { id: 4, name: 'Pistachio Bun', price: 60, emoji: '🥜' },
  { id: 5, name: 'Boiled Egg', price: 12, emoji: '🥚' },
  { id: 6, name: 'Tiramisu', price: 0, emoji: '🍰' },
]

export const COLORS = {
  navy: '#001F3F',
  cream: '#F5F2E8',
  background: '#fcf9da',
} as const

export type Quantities = Record<number, number>