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
    export class BrowserMultiFormatReader { }
    export class BrowserQRCodeReader { }
    export enum BarcodeFormat { }
    export class Result { }
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
