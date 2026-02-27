/**
 * React Three Fiber JSX Type Declarations
 *
 * R3F v9 natively registers ThreeElements into React.JSX for React 19.
 * This file re-exports the type for any consumer that still needs a manual
 * augmentation (e.g. older tsconfig or isolated module setups).
 */

import type { ThreeElements } from '@react-three/fiber'

declare module 'react' {
  namespace JSX {
     
    interface IntrinsicElements extends ThreeElements {}
  }
}
