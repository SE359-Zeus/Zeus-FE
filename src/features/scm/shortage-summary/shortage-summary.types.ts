export interface ShortageSummary {
  stt: number;
  sku: string;
  req_qty: number;
  best_supplier: string;
}

export interface ShortageSummaryParams {
  page?: number;
  limit?: number;
}
