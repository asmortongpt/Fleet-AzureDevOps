/**
 * Type declarations for missing third-party modules
 * These are stub declarations to allow TypeScript compilation
 */

// Excel library
declare module 'xlsx' {
  export const read: any;
  export const write: any;
  export const utils: any;
}

// React Spring for Three.js (optional 3D camera animation dependency)
declare module '@react-spring/three' {
  import type { ComponentType } from 'react';
  export function useSpring(config: any): [any, any];
  export const animated: {
    group: ComponentType<any>;
    mesh: ComponentType<any>;
    [key: string]: ComponentType<any>;
  };
}

// React Three Fiber post-processing
declare module '@react-three/postprocessing' {
  export const EffectComposer: any;
  export const Bloom: any;
  export const ChromaticAberration: any;
  export const DepthOfField: any;
  export const Vignette: any;
}

declare module 'postprocessing' {
  export const BlendFunction: any;
}

// Heroicons
declare module '@heroicons/react/24/outline' {
  export const ChartBarIcon: any;
  export const ClockIcon: any;
  export const UserIcon: any;
  export const TruckIcon: any;
  export const WrenchIcon: any;
  export const BellIcon: any;
  export const CogIcon: any;
  export const DocumentIcon: any;
  export const MapIcon: any;
  export const ChartPieIcon: any;
}

// Expo mobile modules (not used in web build but imported)
declare module 'expo-camera' {
  export const Camera: any;
}

declare module 'expo-location' {
  export const requestForegroundPermissionsAsync: any;
  export const getCurrentPositionAsync: any;
}

// AI SDK packages
declare module '@anthropic-ai/sdk' {
  class Anthropic {
    constructor(options: { apiKey: string });
    messages: {
      create(params: any): Promise<any>;
    };
  }
  export default Anthropic;
}

declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(options: { model: string }): {
      generateContent(prompt: string): Promise<{ response: { text(): string } }>;
    };
  }
}

declare module 'openai' {
  class OpenAI {
    constructor(options: { apiKey: string });
    chat: {
      completions: {
        create(params: any): Promise<{ choices: Array<{ message: { content: string | null } }> }>;
      };
    };
  }
  export default OpenAI;
}
