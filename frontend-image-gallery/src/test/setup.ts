import { afterEach, expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'

expect.extend(matchers)
afterEach(() => cleanup())

const originGetComputedStyle = window.getComputedStyle
window.getComputedStyle = ((elt: Element, pseudoElt?: string) =>
  originGetComputedStyle(elt, pseudoElt && pseudoElt.startsWith('::') ? undefined : pseudoElt)) as typeof window.getComputedStyle

if (!window.matchMedia) {
  window.matchMedia = ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }) as MediaQueryList) as typeof window.matchMedia
}
