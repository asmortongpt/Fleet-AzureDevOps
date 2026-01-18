export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'forex' | 'commodity';
  exchange?: string;
  currency: string;
  price: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  high?: number;
  low?: number;
  open?: number;
  timestamp: Date;
  description?: string;
  sector?: string;
  industry?: string;
  logo?: string;
  website?: string;
  employees?: number;
  headquarters?: string;
  founded?: number;
  isin?: string;
  cusip?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface AssetQuote {
  assetId: string;
  price: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  source?: string;
}

export interface AssetHistoricalData {
  assetId: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
  dividendAmount?: number;
  splitCoefficient?: number;
}

export interface AssetSearch {
  query: string;
  type?: Asset['type'];
  exchange?: string;
  limit?: number;
  offset?: number;
}

export interface AssetSearchResult {
  assets: Asset[];
  total: number;
  hasMore: boolean;
}