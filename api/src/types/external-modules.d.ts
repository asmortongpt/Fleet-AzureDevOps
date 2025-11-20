/**
 * Type declarations for external modules that don't have @types packages
 */

declare module 'cohere-ai' {
  export interface CohereConfig {
    apiKey: string;
  }

  export interface EmbedResponse {
    embeddings: number[][];
  }

  export class CohereClient {
    constructor(config: CohereConfig);
    embed(options: { texts: string[]; model?: string }): Promise<EmbedResponse>;
  }

  export default CohereClient;
}

declare module 'exif-parser' {
  export interface ExifData {
    tags: Record<string, any>;
    imageSize: { width: number; height: number };
    thumbnailOffset?: number;
    thumbnailLength?: number;
  }

  export interface ExifParser {
    parse(): ExifData;
  }

  export function create(buffer: Buffer): ExifParser;
}

declare module 'exifreader' {
  export interface Tags {
    [key: string]: {
      value: any;
      description?: string;
    };
  }

  export interface LoadResult {
    tags: Tags;
  }

  export function load(file: ArrayBuffer | Buffer): LoadResult;
}

declare module 'mammoth' {
  export interface ConvertOptions {
    path?: string;
    buffer?: Buffer;
  }

  export interface ConvertResult {
    value: string;
    messages: any[];
  }

  export function convertToHtml(options: ConvertOptions): Promise<ConvertResult>;
  export function extractRawText(options: ConvertOptions): Promise<ConvertResult>;
}

declare module 'xlsx' {
  export interface WorkSheet {
    [cell: string]: any;
  }

  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheet: string]: WorkSheet };
  }

  export interface ParsingOptions {
    type?: 'base64' | 'binary' | 'buffer' | 'file' | 'array' | 'string';
    cellDates?: boolean;
    cellNF?: boolean;
    cellStyles?: boolean;
  }

  export function read(data: any, opts?: ParsingOptions): WorkBook;
  export function utils: {
    sheet_to_json(worksheet: WorkSheet, opts?: any): any[];
    sheet_to_csv(worksheet: WorkSheet, opts?: any): string;
    book_new(): WorkBook;
  };
}

declare module 'firebase-admin' {
  export interface App {
    messaging(): Messaging;
  }

  export interface Messaging {
    send(message: any): Promise<string>;
    sendMulticast(message: any): Promise<BatchResponse>;
  }

  export interface BatchResponse {
    successCount: number;
    failureCount: number;
    responses: SendResponse[];
  }

  export interface SendResponse {
    success: boolean;
    messageId?: string;
    error?: Error;
  }

  export interface ServiceAccount {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  }

  export function initializeApp(options?: {
    credential?: any;
    databaseURL?: string;
  }): App;

  export namespace credential {
    export function cert(serviceAccount: ServiceAccount | string): any;
  }
}

declare module 'apn' {
  export interface ProviderOptions {
    token?: {
      key: string | Buffer;
      keyId: string;
      teamId: string;
    };
    cert?: string | Buffer;
    key?: string | Buffer;
    production?: boolean;
  }

  export class Provider {
    constructor(options: ProviderOptions);
    send(notification: Notification, tokens: string | string[]): Promise<any>;
    shutdown(): void;
  }

  export class Notification {
    constructor(payload?: any);
    alert: string | object;
    badge?: number;
    sound?: string;
    topic?: string;
    payload?: any;
  }
}

declare module '@pinecone-database/pinecone' {
  export interface PineconeConfig {
    apiKey: string;
    environment: string;
  }

  export interface Vector {
    id: string;
    values: number[];
    metadata?: Record<string, any>;
  }

  export interface QueryResponse {
    matches: Array<{
      id: string;
      score: number;
      metadata?: Record<string, any>;
    }>;
  }

  export class Pinecone {
    constructor(config: PineconeConfig);
    Index(name: string): Index;
  }

  export interface Index {
    upsert(options: { vectors: Vector[] }): Promise<any>;
    query(options: { vector: number[]; topK: number }): Promise<QueryResponse>;
  }
}

declare module '@qdrant/js-client-rest' {
  export interface QdrantConfig {
    url: string;
    apiKey?: string;
  }

  export interface Point {
    id: string | number;
    vector: number[];
    payload?: Record<string, any>;
  }

  export class QdrantClient {
    constructor(config: QdrantConfig);
    upsert(collection: string, options: { points: Point[] }): Promise<any>;
    search(collection: string, options: { vector: number[]; limit: number }): Promise<any>;
  }
}

declare module '@google-cloud/vision' {
  export interface ImageAnnotatorClientConfig {
    keyFilename?: string;
    credentials?: any;
  }

  export class ImageAnnotatorClient {
    constructor(config?: ImageAnnotatorClientConfig);
    textDetection(request: { image: { content: Buffer | string } }): Promise<any>;
    documentTextDetection(request: { image: { content: Buffer | string } }): Promise<any>;
  }
}

declare module '@google-cloud/storage' {
  export interface StorageConfig {
    keyFilename?: string;
    credentials?: any;
    projectId?: string;
  }

  export class Storage {
    constructor(config?: StorageConfig);
    bucket(name: string): Bucket;
  }

  export interface Bucket {
    file(name: string): File;
    upload(path: string, options?: any): Promise<any>;
  }

  export interface File {
    save(data: Buffer | string, options?: any): Promise<void>;
    download(): Promise<[Buffer]>;
    delete(): Promise<void>;
    getSignedUrl(options: any): Promise<[string]>;
  }
}

declare module '@aws-sdk/client-s3' {
  export interface S3ClientConfig {
    region?: string;
    credentials?: any;
  }

  export class S3Client {
    constructor(config: S3ClientConfig);
    send(command: any): Promise<any>;
  }

  export class PutObjectCommand {
    constructor(params: any);
  }

  export class GetObjectCommand {
    constructor(params: any);
  }

  export class DeleteObjectCommand {
    constructor(params: any);
  }

  export class HeadObjectCommand {
    constructor(params: any);
  }
}

declare module '@aws-sdk/s3-request-presigner' {
  export function getSignedUrl(client: any, command: any, options?: { expiresIn?: number }): Promise<string>;
}

declare module '@aws-sdk/client-textract' {
  export interface TextractClientConfig {
    region?: string;
    credentials?: any;
  }

  export class TextractClient {
    constructor(config: TextractClientConfig);
    send(command: any): Promise<any>;
  }

  export class DetectDocumentTextCommand {
    constructor(params: { Document: { Bytes?: Buffer; S3Object?: any } });
  }

  export class AnalyzeDocumentCommand {
    constructor(params: any);
  }
}

declare module 'csrf-csrf' {
  export interface DoubleCsrfConfig {
    getSecret: () => string;
    cookieName?: string;
    cookieOptions?: any;
    size?: number;
    ignoredMethods?: string[];
  }

  export interface DoubleCsrfProtection {
    generateToken: (req: any, res: any) => string;
    doubleCsrfProtection: any;
  }

  export function doubleCsrf(config: DoubleCsrfConfig): DoubleCsrfProtection;
}
