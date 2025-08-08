import { useMemo, useState } from 'react'
import { BenchmarkEntry, TaskType, ModelFamily } from '@/types'
import { format, isWithinInterval, parseISO } from 'date-fns'

interface FilterState {
  search: string
  taskTypes: TaskType[]
  modelFamilies: ModelFamily[]
  datasets: string[]
  dateRange: {
    from?: Date
    to?: Date
  }
  metrics: {
    accuracy?: [number, number]
    f1?: [number, number]
    bleu?: [number, number]
    perplexity?: [number, number]
  }
  modelSize?: {
    min?: number
    max?: number
  }
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

interface UseFilteredDataResult {
  filteredData: BenchmarkEntry[]
  filterState: FilterState
  setFilterState: (state: Partial<FilterState>) => void
  resetFilters: () => void
  availableTaskTypes: TaskType[]
  availableModelFamilies: ModelFamily[]
  availableDatasets: string[]
  activeFilterCount: number
}

const defaultFilterState: FilterState = {
  search: '',
  taskTypes: [],
  modelFamilies: [],
  datasets: [],
  dateRange: {},
  metrics: {}
}

export function useFilteredData(data: BenchmarkEntry[]): UseFilteredDataResult {
  const [filterState, setFilterState] = useState<FilterState>(defaultFilterState)

  // Calculate available options from data
  const availableOptions = useMemo(() => {
    const tasks = new Set<TaskType>()
    const families = new Set<ModelFamily>()
    const datasets = new Set<string>()

    data.forEach(entry => {
      tasks.add(entry.model_info.task_type)
      families.add(entry.model_info.model_family)
      entry.evaluation_results.forEach(result => {
        datasets.add(result.dataset_name)
      })
    })

    return {
      tasks: Array.from(tasks),
      families: Array.from(families),
      datasets: Array.from(datasets)
    }
  }, [data])

  // Apply filters to data
  const filteredData = useMemo(() => {
    return data.filter(entry => {
      // Search filter
      if (filterState.search) {
        const searchTerms = filterState.search.toLowerCase().split(' ')
        const searchableText = [
          entry.model_info.model_name,
          entry.model_info.model_id,
          ...entry.model_info.tags,
          entry.model_info.task_type,
          entry.model_info.model_family
        ].join(' ').toLowerCase()

        if (!searchTerms.every(term => searchableText.includes(term))) {
          return false
        }
      }

      // Task types filter
      if (filterState.taskTypes.length > 0 && !filterState.taskTypes.includes(entry.model_info.task_type)) {
        return false
      }

      // Model families filter
      if (filterState.modelFamilies.length > 0 && !filterState.modelFamilies.includes(entry.model_info.model_family)) {
        return false
      }

      // Datasets filter
      if (filterState.datasets.length > 0 && !entry.evaluation_results.some(result =>
        filterState.datasets.includes(result.dataset_name)
      )) {
        return false
      }

      // Date range filter
      if (filterState.dateRange.from || filterState.dateRange.to) {
        const entryDate = entry.model_info.created_at ? parseISO(entry.model_info.created_at) : null
        if (!entryDate) return false

        if (filterState.dateRange.from && entryDate < filterState.dateRange.from) return false
        if (filterState.dateRange.to && entryDate > filterState.dateRange.to) return false
      }

      // Metric ranges filter
      if (Object.keys(filterState.metrics).length > 0) {
        for (const [metric, [min, max]] of Object.entries(filterState.metrics)) {
          const matchingResult = entry.evaluation_results.find(result =>
            result.metric_name.toLowerCase() === metric.toLowerCase()
          )
          if (matchingResult) {
            if (matchingResult.value < min || matchingResult.value > max) {
              return false
            }
          }
        }
      }

      // Model size filter
      if (filterState.modelSize?.min !== undefined || filterState.modelSize?.max !== undefined) {
        const paramCount = entry.model_info.parameter_count
        if (!paramCount) return false

        if (filterState.modelSize?.min !== undefined && paramCount < filterState.modelSize.min) return false
        if (filterState.modelSize?.max !== undefined && paramCount > filterState.modelSize.max) return false
      }

      return true
    }).sort((a, b) => {
      if (!filterState.sortBy) return 0

      if (filterState.sortBy === 'date') {
        const dateA = a.model_info.created_at ? parseISO(a.model_info.created_at) : new Date(0)
        const dateB = b.model_info.created_at ? parseISO(b.model_info.created_at) : new Date(0)
        return filterState.sortDirection === 'asc' ?
          dateA.getTime() - dateB.getTime() :
          dateB.getTime() - dateA.getTime()
      }

      if (filterState.sortBy === 'downloads') {
        const downloadsA = a.model_info.downloads || 0
        const downloadsB = b.model_info.downloads || 0
        return filterState.sortDirection === 'asc' ?
          downloadsA - downloadsB :
          downloadsB - downloadsA
      }

      // Sort by metric
      const metricA = a.evaluation_results.find(r => r.metric_name === filterState.sortBy)?.value || 0
      const metricB = b.evaluation_results.find(r => r.metric_name === filterState.sortBy)?.value || 0
      return filterState.sortDirection === 'asc' ? metricA - metricB : metricB - metricA
    })
  }, [data, filterState])

  const updateFilterState = (updates: Partial<FilterState>) => {
    setFilterState(current => ({
      ...current,
      ...updates
    }))
  }

  const resetFilters = () => {
    setFilterState(defaultFilterState)
  }

  const activeFilterCount = useMemo(() => {
    return (
      (filterState.search ? 1 : 0) +
      filterState.taskTypes.length +
      filterState.modelFamilies.length +
      filterState.datasets.length +
      (filterState.dateRange.from || filterState.dateRange.to ? 1 : 0) +
      Object.keys(filterState.metrics).length +
      (filterState.modelSize?.min !== undefined || filterState.modelSize?.max !== undefined ? 1 : 0)
    )
  }, [filterState])

  return {
    filteredData,
    filterState,
    setFilterState: updateFilterState,
    resetFilters,
    availableTaskTypes: availableOptions.tasks,
    availableModelFamilies: availableOptions.families,
    availableDatasets: availableOptions.datasets,
    activeFilterCount
  }
}
