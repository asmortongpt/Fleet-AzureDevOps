import * as React from 'react';

declare namespace React {
  // Add utility type for extracting props from component
  type ExtractProps<TComponentOrTProps> = TComponentOrTProps extends React.ComponentType<infer TProps>
    ? TProps
    : TComponentOrTProps;

  // Add utility type for forward ref components
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  type ForwardRefRenderFunction<T, P = {}> = (
    props: React.PropsWithChildren<P>,
    ref: React.Ref<T>
  ) => React.ReactElement | null;

  // Add utility type for component with static properties
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  type ComponentWithStaticProps<P, S = {}> = React.FunctionComponent<P> & S;

  // Add utility type for async components
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  type AsyncComponent<P = {}> = (props: P) => Promise<React.ReactElement | null>;

  // Add utility type for render props
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
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

  // Extend React.JSX namespace for React 18+ new JSX transform
  namespace JSX {
    interface IntrinsicElements {
      // Allow any JSX element (permissive for React Three Fiber and other libraries)
      [elemName: string]: any;
    }
  }
}

// Also extend global JSX for backward compatibility
declare global {
  namespace JSX {
    // Export JSX.Element type for React 18+
    export type Element = React.ReactElement<any, any> | null;

    interface IntrinsicElements {
      // Index signature for any JSX element
      [elemName: string]: any;

      // Explicitly define React Three Fiber elements to avoid TS2339 errors
      group: any;
      mesh: any;
      primitive: any;
      boxGeometry: any;
      sphereGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      bufferGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhysicalMaterial: any;
      pointsMaterial: any;
      ambientLight: any;
      directionalLight: any;
      spotLight: any;
      pointLight: any;
      hemisphereLight: any;
      points: any;
      instancedMesh: any;
      bufferAttribute: any;
      fog: any;
    }
  }
}

export {};
