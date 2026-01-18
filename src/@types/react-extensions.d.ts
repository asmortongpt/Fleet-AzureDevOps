import 'react';

declare module 'react' {
  // Extend ReactNode to include common primitive types
  type ReactNode = React.ReactNode | string | number | boolean | null | undefined;

  // Extend ReactElement to include fragment support
  interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }

  // Extend FunctionComponent to support children prop by default
  interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }, context?: any): ReactElement<any, any> | null;
    propTypes?: WeakValidationMap<P> | undefined;
    contextTypes?: ValidationMap<any> | undefined;
    defaultProps?: Partial<P> | undefined;
    displayName?: string | undefined;
  }

  // Extend ComponentProps to include ref
  type ComponentProps<T extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>> = 
    T extends JSXElementConstructor<infer P>
      ? P
      : T extends keyof JSX.IntrinsicElements
      ? JSX.IntrinsicElements[T]
      : {};

  // Extend PropsWithChildren to be more flexible
  type PropsWithChildren<P = unknown> = P & { children?: ReactNode | undefined };

  // Add utility type for extracting props from component
  type ExtractProps<TComponentOrTProps> = TComponentOrTProps extends React.ComponentType<infer TProps>
    ? TProps
    : TComponentOrTProps;

  // Add utility type for nullable ReactNode
  type ReactNodeArray = ReadonlyArray<ReactNode>;
  type ReactFragment = {} | ReactNodeArray;

  // Extend HTMLAttributes to include data attributes
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    [key: `data-${string}`]: any;
  }

  // Add utility type for forward ref components
  type ForwardRefRenderFunction<T, P = {}> = (
    props: PropsWithChildren<P>,
    ref: React.Ref<T>
  ) => React.ReactElement | null;

  // Extend CSSProperties for custom properties
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }

  // Add utility type for memo components
  type MemoExoticComponent<T extends ComponentType<any>> = NamedExoticComponent<ComponentPropsWithRef<T>> & {
    readonly type: T;
  };

  // Add utility type for lazy components
  type LazyExoticComponent<T extends ComponentType<any>> = ExoticComponent<ComponentPropsWithRef<T>> & {
    readonly _result: T;
  };

  // Extend event handlers to include custom events
  interface DOMAttributes<T> {
    onCustomEvent?: (event: CustomEvent) => void;
  }

  // Add utility type for component with static properties
  type ComponentWithStaticProps<P, S = {}> = FunctionComponent<P> & S;

  // Add utility type for async components
  type AsyncComponent<P = {}> = (props: P) => Promise<ReactElement | null>;

  // Add utility type for render props
  type RenderProp<P = {}> = (props: P) => ReactNode;

  // Add utility type for compound components
  type CompoundComponent<P, S> = FunctionComponent<P> & S;

  // Extend RefObject to include current value type
  interface RefObject<T> {
    readonly current: T | null;
  }

  // Add utility type for conditional rendering
  type ConditionalRender<T> = T | null | undefined | false;

  // Add utility type for style props
  type StyleProp<T> = T | CSSProperties | (T | CSSProperties)[] | undefined;

  // Add utility type for className props
  type ClassNameProp = string | string[] | { [key: string]: boolean } | undefined;

  // Extend key prop type
  type Key = string | number | bigint;

  // Add utility type for portal target
  type PortalTarget = Element | DocumentFragment | null;

  // Add utility type for error boundaries
  interface ErrorInfo {
    componentStack: string;
    digest?: string;
  }

  // Add utility type for suspense
  interface SuspenseProps {
    children?: ReactNode;
    fallback?: ReactNode;
  }

  // Add utility type for strict mode
  interface StrictModeProps {
    children?: ReactNode;
  }

  // Add utility type for profiler
  interface ProfilerProps {
    id: string;
    onRender: ProfilerOnRenderCallback;
    children?: ReactNode;
  }

  type ProfilerOnRenderCallback = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number,
    interactions: Set<any>
  ) => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};