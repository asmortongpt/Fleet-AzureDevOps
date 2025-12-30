export async function getAssets() {
  return []
}

export async function getAsset(id: string) {
  return null
}

export async function createAsset(data: unknown) {
  return data
}

export async function checkInAsset(assetId: string, data: unknown) {
  return { assetId, ...data }
}

export async function checkOutAsset(assetId: string, data: unknown) {
  return { assetId, ...data }
}
