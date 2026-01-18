declare module '@mui/material' {
  export interface Theme {
    customShadows?: {
      z1?: string;
      z4?: string;
      z8?: string;
      z12?: string;
      z16?: string;
      z20?: string;
      z24?: string;
      primary?: string;
      secondary?: string;
      info?: string;
      success?: string;
      warning?: string;
      error?: string;
      card?: string;
      dialog?: string;
      dropdown?: string;
    };
  }

  export interface ThemeOptions {
    customShadows?: {
      z1?: string;
      z4?: string;
      z8?: string;
      z12?: string;
      z16?: string;
      z20?: string;
      z24?: string;
      primary?: string;
      secondary?: string;
      info?: string;
      success?: string;
      warning?: string;
      error?: string;
      card?: string;
      dialog?: string;
      dropdown?: string;
    };
  }
}

declare module '@mui/material/styles' {
  export interface TypographyVariants {
    fontWeightSemiBold?: number;
  }

  export interface TypographyVariantsOptions {
    fontWeightSemiBold?: number;
  }
}

declare module 'react-apexcharts' {
  import { Component } from 'react';
  import { ApexOptions } from 'apexcharts';

  export interface Props {
    type?: 'line' | 'area' | 'bar' | 'histogram' | 'pie' | 'donut' | 'radialBar' | 'scatter' | 'bubble' | 'heatmap' | 'treemap' | 'boxPlot' | 'candlestick' | 'radar' | 'polarArea' | 'rangeBar';
    series?: ApexOptions['series'];
    width?: string | number;
    height?: string | number;
    options?: ApexOptions;
    [key: string]: any;
  }

  export default class ReactApexChart extends Component<Props> {}
}

declare module 'simplebar-react' {
  import { FC, HTMLAttributes } from 'react';

  export interface SimpleBarProps extends HTMLAttributes<HTMLDivElement> {
    style?: React.CSSProperties;
    autoHide?: boolean;
    scrollbarMinSize?: number;
    scrollbarMaxSize?: number;
    forceVisible?: boolean | 'x' | 'y';
    clickOnTrack?: boolean;
    direction?: 'ltr' | 'rtl';
    timeout?: number;
    classNames?: {
      content?: string;
      scrollContent?: string;
      scrollbar?: string;
      track?: string;
    };
  }

  const SimpleBar: FC<SimpleBarProps>;
  export default SimpleBar;
}

declare module 'react-helmet-async' {
  export { Helmet, HelmetProvider } from 'react-helmet-async';
}