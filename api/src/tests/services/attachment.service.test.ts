/**
 * Attachment Service Tests
 *
 * Tests for file attachment handling including:
 * - Azure Blob upload/download
 * - File validation
 * - SAS URL generation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock file types
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const mockFile: UploadedFile = {
  fieldname: 'file',
  originalname: 'test-document.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 102400,
  buffer: Buffer.from('mock file content')
};

const mockBlobClient = {
  upload: vi.fn(),
  download: vi.fn(),
  generateSasUrl: vi.fn(),
  delete: vi.fn(),
  exists: vi.fn()
};

// Mock Attachment Service
class AttachmentService {
  private readonly allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  private readonly maxFileSizeBytes = 10 * 1024 * 1024; // 10MB

  constructor(private blobService: any) {}

  validateFile(file: UploadedFile): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.maxFileSizeBytes / 1024 / 1024}MB`
      };
    }

    // Check mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} is not allowed`
      };
    }

    // Check filename
    if (!file.originalname || file.originalname.length === 0) {
      return {
        valid: false,
        error: 'Filename is required'
      };
    }

    return { valid: true };
  }

  async uploadFile(file: UploadedFile, userId: string): Promise<{
    blobName: string;
    url: string;
    size: number;
  }> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const timestamp = Date.now();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobName = `${userId}/${timestamp}_${sanitizedFilename}`;

    await this.blobService.upload(blobName, file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype
      }
    });

    const url = await this.generateSasUrl(blobName, 24 * 60); // 24 hours

    return {
      blobName,
      url,
      size: file.size
    };
  }

  async downloadFile(blobName: string): Promise<Buffer> {
    const downloadResponse = await this.blobService.download(blobName);
    return downloadResponse.readableStreamBody;
  }

  async generateSasUrl(blobName: string, expiryMinutes: number = 60): Promise<string> {
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + expiryMinutes);

    return this.blobService.generateSasUrl(blobName, {
      permissions: 'r',
      expiresOn: expiryDate
    });
  }

  async deleteFile(blobName: string): Promise<boolean> {
    try {
      await this.blobService.delete(blobName);
      return true;
    } catch (error) {
      return false;
    }
  }

  async fileExists(blobName: string): Promise<boolean> {
    try {
      return await this.blobService.exists(blobName);
    } catch (error) {
      return false;
    }
  }

  getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }
}

describe('AttachmentService', () => {
  let service: AttachmentService;

  beforeEach(() => {
    service = new AttachmentService(mockBlobClient);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('File Validation', () => {
    it('should validate a valid file', () => {
      const result = service.validateFile(mockFile);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const largeFile = {
        ...mockFile,
        size: 15 * 1024 * 1024 // 15MB
      };

      const result = service.validateFile(largeFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds maximum');
    });

    it('should reject files with invalid mime type', () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'application/x-executable'
      };

      const result = service.validateFile(invalidFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File type');
      expect(result.error).toContain('is not allowed');
    });

    it('should reject files without a filename', () => {
      const noNameFile = {
        ...mockFile,
        originalname: ''
      };

      const result = service.validateFile(noNameFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Filename is required');
    });

    it('should accept all allowed mime types', () => {
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
      ];

      allowedTypes.forEach(mimetype => {
        const file = { ...mockFile, mimetype };
        const result = service.validateFile(file);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('File Upload', () => {
    it('should upload a valid file to Azure Blob Storage', async () => {
      mockBlobClient.upload.mockResolvedValue({});
      mockBlobClient.generateSasUrl.mockResolvedValue('https://example.com/file.pdf?sas=token');

      const result = await service.uploadFile(mockFile, 'user_123');

      expect(mockBlobClient.upload).toHaveBeenCalledWith(
        expect.stringContaining('user_123/'),
        mockFile.buffer,
        expect.any(Object)
      );
      expect(result.blobName).toContain('user_123/');
      expect(result.blobName).toContain('test-document.pdf');
      expect(result.url).toBe('https://example.com/file.pdf?sas=token');
      expect(result.size).toBe(mockFile.size);
    });

    it('should sanitize filename in blob name', async () => {
      const unsafeFile = {
        ...mockFile,
        originalname: 'test file with spaces & symbols!.pdf'
      };

      mockBlobClient.upload.mockResolvedValue({});
      mockBlobClient.generateSasUrl.mockResolvedValue('https://example.com/file.pdf');

      const result = await service.uploadFile(unsafeFile, 'user_123');

      expect(result.blobName).toMatch(/test_file_with_spaces___symbols_.pdf/);
      expect(result.blobName).not.toContain(' ');
      expect(result.blobName).not.toContain('&');
      expect(result.blobName).not.toContain('!');
    });

    it('should include timestamp in blob name', async () => {
      mockBlobClient.upload.mockResolvedValue({});
      mockBlobClient.generateSasUrl.mockResolvedValue('https://example.com/file.pdf');

      const beforeTime = Date.now();
      const result = await service.uploadFile(mockFile, 'user_123');
      const afterTime = Date.now();

      const timestampMatch = result.blobName.match(/\/(\d+)_/);
      expect(timestampMatch).toBeTruthy();

      const timestamp = parseInt(timestampMatch![1]);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should reject invalid file on upload', async () => {
      const invalidFile = {
        ...mockFile,
        size: 20 * 1024 * 1024 // Too large
      };

      await expect(
        service.uploadFile(invalidFile, 'user_123')
      ).rejects.toThrow('File size exceeds maximum');

      expect(mockBlobClient.upload).not.toHaveBeenCalled();
    });

    it('should handle upload failure', async () => {
      mockBlobClient.upload.mockRejectedValue(new Error('Upload failed'));

      await expect(
        service.uploadFile(mockFile, 'user_123')
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('File Download', () => {
    it('should download a file from Azure Blob Storage', async () => {
      const mockBuffer = Buffer.from('file content');
      mockBlobClient.download.mockResolvedValue({
        readableStreamBody: mockBuffer
      });

      const result = await service.downloadFile('user_123/file.pdf');

      expect(mockBlobClient.download).toHaveBeenCalledWith('user_123/file.pdf');
      expect(result).toBe(mockBuffer);
    });

    it('should handle download failure', async () => {
      mockBlobClient.download.mockRejectedValue(new Error('File not found'));

      await expect(
        service.downloadFile('nonexistent/file.pdf')
      ).rejects.toThrow('File not found');
    });
  });

  describe('SAS URL Generation', () => {
    it('should generate SAS URL with default expiry', async () => {
      const mockUrl = 'https://storage.blob.core.windows.net/container/file.pdf?sv=2021-06-08&se=...';
      mockBlobClient.generateSasUrl.mockResolvedValue(mockUrl);

      const url = await service.generateSasUrl('user_123/file.pdf');

      expect(mockBlobClient.generateSasUrl).toHaveBeenCalledWith(
        'user_123/file.pdf',
        expect.objectContaining({
          permissions: 'r',
          expiresOn: expect.any(Date)
        })
      );
      expect(url).toBe(mockUrl);
    });

    it('should generate SAS URL with custom expiry', async () => {
      const mockUrl = 'https://storage.blob.core.windows.net/container/file.pdf?sv=...';
      mockBlobClient.generateSasUrl.mockResolvedValue(mockUrl);

      await service.generateSasUrl('user_123/file.pdf', 120);

      const call = mockBlobClient.generateSasUrl.mock.calls[0];
      const expiresOn = call[1].expiresOn as Date;
      const expectedExpiry = new Date();
      expectedExpiry.setMinutes(expectedExpiry.getMinutes() + 120);

      // Allow 1 second tolerance
      expect(Math.abs(expiresOn.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    });

    it('should handle SAS generation failure', async () => {
      mockBlobClient.generateSasUrl.mockRejectedValue(new Error('SAS generation failed'));

      await expect(
        service.generateSasUrl('user_123/file.pdf')
      ).rejects.toThrow('SAS generation failed');
    });
  });

  describe('File Deletion', () => {
    it('should delete a file successfully', async () => {
      mockBlobClient.delete.mockResolvedValue({});

      const result = await service.deleteFile('user_123/file.pdf');

      expect(mockBlobClient.delete).toHaveBeenCalledWith('user_123/file.pdf');
      expect(result).toBe(true);
    });

    it('should return false on deletion failure', async () => {
      mockBlobClient.delete.mockRejectedValue(new Error('Delete failed'));

      const result = await service.deleteFile('user_123/file.pdf');

      expect(result).toBe(false);
    });
  });

  describe('File Existence Check', () => {
    it('should check if file exists', async () => {
      mockBlobClient.exists.mockResolvedValue(true);

      const exists = await service.fileExists('user_123/file.pdf');

      expect(mockBlobClient.exists).toHaveBeenCalledWith('user_123/file.pdf');
      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      mockBlobClient.exists.mockResolvedValue(false);

      const exists = await service.fileExists('nonexistent/file.pdf');

      expect(exists).toBe(false);
    });

    it('should return false on error', async () => {
      mockBlobClient.exists.mockRejectedValue(new Error('Check failed'));

      const exists = await service.fileExists('user_123/file.pdf');

      expect(exists).toBe(false);
    });
  });

  describe('File Utilities', () => {
    it('should extract file extension', () => {
      expect(service.getFileExtension('document.pdf')).toBe('pdf');
      expect(service.getFileExtension('image.png')).toBe('png');
      expect(service.getFileExtension('archive.tar.gz')).toBe('gz');
      expect(service.getFileExtension('noextension')).toBe('');
    });

    it('should identify image files', () => {
      expect(service.isImageFile('image/jpeg')).toBe(true);
      expect(service.isImageFile('image/png')).toBe(true);
      expect(service.isImageFile('image/gif')).toBe(true);
      expect(service.isImageFile('application/pdf')).toBe(false);
      expect(service.isImageFile('text/plain')).toBe(false);
    });
  });
});
