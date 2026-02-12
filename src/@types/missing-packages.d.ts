// Type declarations for packages without @types
import * as React from 'react';

type AntdComponent = React.ComponentType<Record<string, unknown>>;

declare module 'antd' {
    export const Table: AntdComponent;
    export const Select: AntdComponent;
    export const DatePicker: AntdComponent;
    export const Card: AntdComponent;
    export const Row: AntdComponent;
    export const Col: AntdComponent;
    export const Statistic: AntdComponent;
    export const Tag: AntdComponent;
    export const Button: AntdComponent;
    export const Typography: AntdComponent;
    export const Spin: AntdComponent;
    export const Alert: AntdComponent;
    export const Empty: AntdComponent;
    export const Progress: AntdComponent;
    export const Tooltip: AntdComponent;
    export const Space: AntdComponent;
    export const Form: AntdComponent;
    export const Input: AntdComponent;
    export const Modal: AntdComponent;
    export const Upload: AntdComponent;
    export const message: Record<string, unknown>;
    export const notification: Record<string, unknown>;
    export const Tabs: AntdComponent;
    export const Radio: AntdComponent;
    export const Checkbox: AntdComponent;
    export const RangePicker: AntdComponent;
}

declare module 'react-toastify' {
    export const toast: Record<string, unknown>;
    export const ToastContainer: AntdComponent;
    export const Slide: Record<string, unknown>;
    export const Zoom: Record<string, unknown>;
    export const Flip: Record<string, unknown>;
    export const Bounce: Record<string, unknown>;
}

declare module 'react-bootstrap' {
    export const Modal: AntdComponent;
    export const Button: AntdComponent;
    export const Form: AntdComponent;
    export const Container: AntdComponent;
    export const Row: AntdComponent;
    export const Col: AntdComponent;
    export const Card: AntdComponent;
    export const Alert: AntdComponent;
    export const Spinner: AntdComponent;
    export const Table: AntdComponent;
    export const Badge: AntdComponent;
    export const Nav: AntdComponent;
    export const Navbar: AntdComponent;
    export const Dropdown: AntdComponent;
    export const Tab: AntdComponent;
    export const Tabs: AntdComponent;
}

declare module '@zxing/library' {
    export class BrowserMultiFormatReader {
        decodeFromVideoDevice(
            deviceId: string | undefined,
            videoElement: HTMLVideoElement,
            callback: (result: Result, error?: Error) => void
        ): void;
        reset(): void;
    }
    export class BrowserQRCodeReader { }
    export enum BarcodeFormat { }
    export class Result {
        getText(): string;
        getBarcodeFormat(): BarcodeFormat;
    }
}

declare module 'react-webcam' {
    const Webcam: AntdComponent;
    export default Webcam;
}

declare module 'bcryptjs' {
    export function hash(data: string, saltOrRounds: string | number): Promise<string>;
    export function compare(data: string, encrypted: string): Promise<boolean>;
    export function genSalt(rounds?: number): Promise<string>;
    export function hashSync(data: string, saltOrRounds: string | number): string;
    export function compareSync(data: string, encrypted: string): boolean;
    export function genSaltSync(rounds?: number): string;
}

declare module 'awilix' {
    export function createContainer(options?: Record<string, unknown>): AwilixContainer;
    export function asClass(ctor: unknown, options?: Record<string, unknown>): unknown;
    export function asFunction(fn: unknown, options?: Record<string, unknown>): unknown;
    export function asValue(value: unknown): unknown;
    export const InjectionMode: Record<string, unknown>;
    export interface AwilixContainer {
        register(registrations: Record<string, unknown>): AwilixContainer;
        resolve<T>(name: string): T;
        createScope(): AwilixContainer;
    }
}

declare module '@auth0/auth0-spa-js' {
    export interface Auth0ClientOptions extends Record<string, unknown> {
        domain: string;
        client_id: string;
        redirect_uri?: string;
        audience?: string;
        scope?: string;
    }
    export interface Auth0User extends Record<string, unknown> {
        sub?: string;
        name?: string;
        email?: string;
    }
    export default class Auth0Client {
        constructor(options: Auth0ClientOptions);
        loginWithRedirect(options?: Record<string, unknown>): Promise<void>;
        handleRedirectCallback(): Promise<{ appState?: Record<string, unknown> }>;
        getTokenSilently(options?: Record<string, unknown>): Promise<string>;
        getUser(): Promise<Auth0User | undefined>;
        logout(options?: Record<string, unknown>): void;
        isAuthenticated(): Promise<boolean>;
    }
}

declare module 'winston' {
    export interface LogEntry extends Record<string, unknown> {
        level: string;
        message: string;
        timestamp?: string;
    }
    export interface LoggerOptions extends Record<string, unknown> {
        level?: string;
        format?: unknown;
        transports?: unknown[];
    }
    export function createLogger(options?: LoggerOptions): Logger;
    export const format: Record<string, unknown>;
    export const transports: Record<string, unknown>;
    export interface Logger {
        debug(message: string, meta?: Record<string, unknown>): Logger;
        info(message: string, meta?: Record<string, unknown>): Logger;
        warn(message: string, meta?: Record<string, unknown>): Logger;
        error(message: string, meta?: Record<string, unknown>): Logger;
    }
}

declare module 'expo-camera' {
    export const Camera: React.ComponentType<Record<string, unknown>>;
    export const CameraType: Record<string, unknown>;
    export const BarCodeScanner: React.ComponentType<Record<string, unknown>>;
}

declare module 'expo-location' {
    export interface PermissionStatus {
        status: string;
        expires?: string;
    }
    export interface Location {
        coords: {
            latitude: number;
            longitude: number;
            altitude?: number;
            accuracy?: number;
            altitudeAccuracy?: number;
            heading?: number;
            speed?: number;
        };
        timestamp: number;
    }
    export function requestForegroundPermissionsAsync(): Promise<PermissionStatus>;
    export function getCurrentPositionAsync(options?: Record<string, unknown>): Promise<Location>;
    export function watchPositionAsync(
        options: Record<string, unknown>,
        callback: (location: Location) => void
    ): Promise<() => void>;
}

declare module 'react-native' {
    export const View: React.ComponentType<Record<string, unknown>>;
    export const Text: React.ComponentType<Record<string, unknown>>;
    export const StyleSheet: {
        create(styles: Record<string, Record<string, unknown>>): Record<string, number>;
    };
    export const TouchableOpacity: React.ComponentType<Record<string, unknown>>;
    export const ActivityIndicator: React.ComponentType<Record<string, unknown>>;
    export const Platform: {
        OS: string;
        Version?: number;
        select<T>(specifiers: Record<string, T>): T;
    };
    export const Dimensions: {
        get(dim: 'window' | 'screen'): { width: number; height: number };
    };
    export const Alert: {
        alert(
            title: string,
            message?: string,
            buttons?: Array<{ text: string; onPress?: () => void }>,
            options?: Record<string, unknown>
        ): void;
    };
}

declare module '@react-native-async-storage/async-storage' {
    const AsyncStorage: {
        getItem(key: string): Promise<string | null>;
        setItem(key: string, value: string): Promise<void>;
        removeItem(key: string): Promise<void>;
        clear(): Promise<void>;
    };
    export default AsyncStorage;
}
