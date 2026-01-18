declare module 'react-dropzone' {
  import { CSSProperties, DragEvent, InputHTMLAttributes, ReactNode } from 'react';

  export interface FileError {
    message: string;
    code: 'file-too-large' | 'file-too-small' | 'too-many-files' | 'file-invalid-type' | string;
  }

  export interface FileRejection {
    file: File;
    errors: FileError[];
  }

  export type DropEvent = DragEvent<HTMLElement> | InputEvent | Event;

  export interface DropzoneState {
    isFocused: boolean;
    isDragActive: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
    isFileDialogActive: boolean;
    acceptedFiles: File[];
    fileRejections: FileRejection[];
    rootRef: React.RefObject<HTMLElement>;
    inputRef: React.RefObject<HTMLInputElement>;
    open: () => void;
  }

  export interface DropzoneRootProps {
    refKey?: string;
    role?: string;
    className?: string;
    style?: CSSProperties;
    tabIndex?: number;
    onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    onDragEnter?: (event: DragEvent<HTMLElement>) => void;
    onDragOver?: (event: DragEvent<HTMLElement>) => void;
    onDragLeave?: (event: DragEvent<HTMLElement>) => void;
    onDrop?: (event: DragEvent<HTMLElement>) => void;
    [key: string]: any;
  }

  export interface DropzoneInputProps extends InputHTMLAttributes<HTMLInputElement> {
    refKey?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
    autoComplete?: string;
    tabIndex?: number;
  }

  export interface DropzoneOptions {
    accept?: Accept;
    disabled?: boolean;
    maxSize?: number;
    minSize?: number;
    multiple?: boolean;
    maxFiles?: number;
    preventDropOnDocument?: boolean;
    noClick?: boolean;
    noKeyboard?: boolean;
    noDrag?: boolean;
    noDragEventsBubbling?: boolean;
    onDrop?: (acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => void;
    onDropAccepted?: (files: File[], event: DropEvent) => void;
    onDropRejected?: (fileRejections: FileRejection[], event: DropEvent) => void;
    onFileDialogCancel?: () => void;
    onFileDialogOpen?: () => void;
    onError?: (err: Error) => void;
    validator?: (file: File) => FileError | FileError[] | null;
    useFsAccessApi?: boolean;
    autoFocus?: boolean;
  }

  export type Accept = {
    [key: string]: string[];
  };

  export interface DropzoneRef {
    open: () => void;
  }

  export function useDropzone(options?: DropzoneOptions): DropzoneState & {
    getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
    getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
    open: () => void;
    acceptedFiles: File[];
    fileRejections: FileRejection[];
    rootRef: React.RefObject<HTMLElement>;
    inputRef: React.RefObject<HTMLInputElement>;
    isFocused: boolean;
    isDragActive: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
    isFileDialogActive: boolean;
  };

  export interface DropzoneProps extends DropzoneOptions {
    children?: (state: DropzoneState & {
      getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
      getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
    }) => ReactNode;
  }

  export default function Dropzone(props: DropzoneProps): JSX.Element;
}