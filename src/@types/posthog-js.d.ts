// Type declaration for posthog-js (package not installed)
declare module 'posthog-js' {
  interface PostHogConfig {
    api_host?: string;
    loaded?: (posthog: PostHog) => void;
    capture_pageview?: boolean;
    capture_pageleave?: boolean;
    autocapture?: boolean;
    disable_session_recording?: boolean;
    session_recording?: {
      maskAllInputs?: boolean;
      recordCrossOriginIframes?: boolean;
    };
    persistence?: string;
    opt_out_capturing_by_default?: boolean;
    respect_dnt?: boolean;
    property_blacklist?: string[];
    sanitize_properties?: (properties: Record<string, unknown>) => Record<string, unknown>;
    enable_recording_console_log?: boolean;
    capture_performance?: boolean;
    cross_subdomain_cookie?: boolean;
    secure_cookie?: boolean;
  }

  interface PostHog {
    init(apiKey: string, config?: PostHogConfig): void;
    identify(userId: string, traits?: Record<string, unknown>): void;
    capture(event: string, properties?: Record<string, unknown>): void;
    reset(): void;
    isFeatureEnabled(flag: string): boolean | undefined;
    getFeatureFlag(flag: string): string | boolean | undefined;
    onFeatureFlags(callback: (flags: string[], variants: Record<string, string | boolean>) => void): void;
    reloadFeatureFlags(): void;
    get_property(key: string): unknown;
    startSessionRecording(): void;
    stopSessionRecording(): void;
    get_session_id(): string | undefined;
    opt_out_capturing(): void;
    opt_in_capturing(): void;
    has_opted_out_capturing(): boolean;
    get_distinct_id(): string;
    debug(enabled: boolean): void;
    people: {
      set(properties: Record<string, unknown>): void;
    };
  }

  const posthog: PostHog;
  export default posthog;
}
