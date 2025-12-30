// Type declarations for packages without @types

declare module 'antd' {
    export const Table: any;
    export const Select: any;
    export const DatePicker: any;
    export const Card: any;
    export const Row: any;
    export const Col: any;
    export const Statistic: any;
    export const Tag: any;
    export const Button: any;
    export const Typography: any;
    export const Spin: any;
    export const Alert: any;
    export const Empty: any;
    export const Progress: any;
    export const Tooltip: any;
    export const Space: any;
    export const Form: any;
    export const Input: any;
    export const Modal: any;
    export const Upload: any;
    export const message: any;
    export const notification: any;
    export const Tabs: any;
    export const Radio: any;
    export const Checkbox: any;
    export const RangePicker: any;
}

declare module 'react-toastify' {
    export const toast: any;
    export const ToastContainer: any;
    export const Slide: any;
    export const Zoom: any;
    export const Flip: any;
    export const Bounce: any;
}

declare module 'react-bootstrap' {
    export const Modal: any;
    export const Button: any;
    export const Form: any;
    export const Container: any;
    export const Row: any;
    export const Col: any;
    export const Card: any;
    export const Alert: any;
    export const Spinner: any;
    export const Table: any;
    export const Badge: any;
    export const Nav: any;
    export const Navbar: any;
    export const Dropdown: any;
    export const Tab: any;
    export const Tabs: any;
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
    const Webcam: any;
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

declare module '@tanstack/react-virtual' {
    export const useVirtualizer: any;
    export const VirtualItem: any;
}

declare module 'awilix' {
    export const createContainer: any;
    export const asClass: any;
    export const asFunction: any;
    export const asValue: any;
    export const InjectionMode: any;
    export type AwilixContainer = any;
}

declare module 'web-vitals' {
    export const onCLS: any;
    export const onFID: any;
    export const onFCP: any;
    export const onLCP: any;
    export const onTTFB: any;
}

declare module '@auth0/auth0-spa-js' {
    export default class Auth0Client {
        constructor(options: any);
        loginWithRedirect(options?: any): Promise<void>;
        handleRedirectCallback(): Promise<any>;
        getTokenSilently(options?: any): Promise<string>;
        getUser(): Promise<any>;
        logout(options?: any): void;
        isAuthenticated(): Promise<boolean>;
    }
}

declare module 'winston' {
    export const createLogger: any;
    export const format: any;
    export const transports: any;
    export const Logger: any;
}

declare module 'expo-camera' {
    export const Camera: any;
    export const CameraType: any;
    export const BarCodeScanner: any;
}

declare module 'expo-location' {
    export const requestForegroundPermissionsAsync: any;
    export const getCurrentPositionAsync: any;
    export const watchPositionAsync: any;
}

declare module 'react-native' {
    export const View: any;
    export const Text: any;
    export const StyleSheet: any;
    export const TouchableOpacity: any;
    export const ActivityIndicator: any;
    export const Platform: any;
    export const Dimensions: any;
    export const Alert: any;
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
