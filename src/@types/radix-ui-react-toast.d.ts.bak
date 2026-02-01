declare module '@radix-ui/react-toast' {
    import * as React from 'react';

    export interface ToastProviderProps {
        children?: React.ReactNode;
        duration?: number;
        label?: string;
        swipeDirection?: 'right' | 'left' | 'up' | 'down';
        swipeThreshold?: number;
    }

    export const Provider: React.FC<ToastProviderProps>;

    export const Viewport: React.ForwardRefExoticComponent<
        React.HTMLAttributes<HTMLOListElement> & React.RefAttributes<HTMLOListElement>
    > & { displayName?: string };

    export const Root: React.ForwardRefExoticComponent<
        React.HTMLAttributes<HTMLLIElement> & {
            open?: boolean;
            defaultOpen?: boolean;
            onOpenChange?: (open: boolean) => void;
            type?: 'foreground' | 'background';
            duration?: number;
            forceMount?: boolean;
        } & React.RefAttributes<HTMLLIElement>
    > & { displayName?: string };

    export const Action: React.ForwardRefExoticComponent<
        React.ButtonHTMLAttributes<HTMLButtonElement> & {
            altText: string;
        } & React.RefAttributes<HTMLButtonElement>
    > & { displayName?: string };

    export const Close: React.ForwardRefExoticComponent<
        React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>
    > & { displayName?: string };

    export const Title: React.ForwardRefExoticComponent<
        React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
    > & { displayName?: string };

    export const Description: React.ForwardRefExoticComponent<
        React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
    > & { displayName?: string };
}
