/**
 * React Three Fiber JSX Type Declarations
 *
 * With @types/react v19+ and "jsx": "react-jsx", TypeScript resolves JSX types
 * from React.JSX (inside the 'react' module), not the global JSX namespace.
 * R3F v8 only extends the global JSX namespace, so we must augment the 'react'
 * module directly to register R3F intrinsic elements.
 */

import type { ThreeElements } from '@react-three/fiber'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
