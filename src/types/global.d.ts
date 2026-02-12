declare module 'jest-axe' {
  export const axe: any
  export function toHaveNoViolations(): any
}

declare module 'react-helmet' {
  import * as React from 'react'

  export interface HelmetProps {
    children?: React.ReactNode
    title?: string
    titleTemplate?: string
    defaultTitle?: string
    onChangeClientState?: (newState: any, addedTags: any, removedTags: any) => void
  }

  export class Helmet extends React.Component<HelmetProps> {}
}

declare const mockLeaflet: any
declare const mockGoogleMaps: any
