import { apiGet } from '@/lib/axios.client'
import type { ApiResponse, PaginatedResult } from '@/lib/types/api.types'
import type { ShortageSummary, ShortageSummaryParams } from './shortage-summary.types'

export const shortageSummaryService = {
  getShortageSummary: (params?: ShortageSummaryParams): Promise<ApiResponse<PaginatedResult<ShortageSummary>>> => {
    return apiGet<PaginatedResult<ShortageSummary>>('/scm/vendors/shortage-summary', { params })
  }
}
