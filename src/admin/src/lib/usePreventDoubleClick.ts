import { useRef } from 'react'

export function usePreventDoubleClick(delay = 1000) {
  const lastClick = useRef<number>(0)

  function canClick() {
    const now = Date.now()
    if (now - lastClick.current < delay) {
      return false
    }
    lastClick.current = now
    return true
  }

  return { canClick }
}