'use client'

import { useQuery } from '@tanstack/react-query'
import { shortageSummaryService } from '../shortage-summary.service'
import type { ShortageSummaryParams } from '../shortage-summary.types'

export const shortageSummaryKeys = {
  all: ['shortageSummary'] as const,
  list: (params: ShortageSummaryParams) => [...shortageSummaryKeys.all, params] as const,
}

export function useShortageSummary(params: ShortageSummaryParams) {
  return useQuery({
    queryKey: shortageSummaryKeys.list(params),
    queryFn: () => shortageSummaryService.getShortageSummary(params),
  })
}
