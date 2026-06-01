'use client'

import { useQuery } from '@tanstack/react-query'
import { shortageSummaryService } from '../shortage-summary.service'

export const shortageSummaryKeys = {
  all: ['shortageSummary'] as const,
}

export function useShortageSummary() {
  return useQuery({
    queryKey: shortageSummaryKeys.all,
    queryFn: () => shortageSummaryService.getShortageSummary(),
  })
}
