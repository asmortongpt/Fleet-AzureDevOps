export class PhotoStorageService {
  async upload(file: File): Promise<string> {
    return URL.createObjectURL(file)
  }
  async download(url: string): Promise<Blob> {
    const response = await fetch(url)
    return response.blob()
  }
}

export default new PhotoStorageService()
