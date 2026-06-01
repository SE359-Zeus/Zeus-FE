import { apiGet } from '@/lib/axios.client'
import type { ApiResponse } from '@/lib/types/api.types'
import type { ShortageSummary } from './shortage-summary.types'

export const shortageSummaryService = {
  getShortageSummary: (): Promise<ApiResponse<ShortageSummary[]>> => {
    return apiGet<ShortageSummary[]>('/scm/vendors/shortage-summary')
  }
}
