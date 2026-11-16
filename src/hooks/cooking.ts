export type CookingState = { checked: number[]; current: number }
export type CookingAction =
  | { type: 'toggle'; index: number }
  | { type: 'next'; stepCount: number }
  | { type: 'prev' }
  | { type: 'goto'; index: number; stepCount: number }

const clamp = (n: number, max: number) => Math.max(0, Math.min(n, Math.max(0, max)))

export function cookingReducer(s: CookingState, a: CookingAction): CookingState {
  switch (a.type) {
    case 'toggle':
      return {
        ...s,
        checked: s.checked.includes(a.index) ? s.checked.filter((i) => i !== a.index) : [...s.checked, a.index],
      }
    case 'next':
      return { ...s, current: clamp(s.current + 1, a.stepCount - 1) }
    case 'prev':
      return { ...s, current: Math.max(0, s.current - 1) }
    case 'goto':
      return { ...s, current: clamp(a.index, a.stepCount - 1) }
  }
}
