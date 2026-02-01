```typescript
import * as React from 'react';

declare namespace React {
  // Add utility type for extracting props from component
  type ExtractProps<TComponentOrTProps> = TComponentOrTProps extends React.ComponentType<infer TProps>
    ? TProps
    : TComponentOrTProps;

  // Add utility type for forward ref components
  type ForwardRefRenderFunction<T, P = {}> = (
    props: React.PropsWithChildren<P>,
    ref: React.Ref<T>
  ) => React.ReactElement | null;

  // Add utility type for component with static properties
  type ComponentWithStaticProps<P, S = {}> = React.FunctionComponent<P> & S;

  // Add utility type for async components
  type AsyncComponent<P = {}> = (props: P) => Promise<React.ReactElement | null>;

  // Add utility type for render props
  type RenderProp<P = {}> = (props: P) => React.ReactNode;

  // Add utility type for compound components
  type CompoundComponent<P, S> = React.FunctionComponent<P> & S;

  // Add utility type for conditional rendering
  type ConditionalRender<T> = T | null | undefined | false;

  // Add utility type for style props
  type StyleProp<T> = T | React.CSSProperties | (T | React.CSSProperties)[] | undefined;

  // Add utility type for className props
  type ClassNameProp = string | string[] | { [key: string]: boolean } | undefined;

  // Add utility type for portal target
  type PortalTarget = Element | DocumentFragment | null;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
```