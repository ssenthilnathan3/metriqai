import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Search,
  SlidersHorizontal,
  BarChart2,
  Calendar,
  Tag,
  Database,
  X,
  Check,
  Download
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TaskType, ModelFamily } from '@/types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getTaskDisplayName, getModelFamilyDisplayName } from '@/lib/utils'

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void
  availableTaskTypes: TaskType[]
  availableModelFamilies: ModelFamily[]
  availableDatasets: string[]
  initialFilters?: Partial<FilterState>
  onExportData?: () => void
  className?: string
}

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

export function FilterBar({
  onFilterChange,
  availableTaskTypes,
  availableModelFamilies,
  availableDatasets,
  initialFilters,
  onExportData,
  className = ''
}: FilterBarProps) {
  const [filters, setFilters] = React.useState<FilterState>({
    search: '',
    taskTypes: [],
    modelFamilies: [],
    datasets: [],
    dateRange: {},
    metrics: {},
    ...initialFilters
  })

  const handleFilterChange = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: FilterState = {
      search: '',
      taskTypes: [],
      modelFamilies: [],
      datasets: [],
      dateRange: {},
      metrics: {}
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const activeFilterCount =
    (filters.taskTypes?.length || 0) +
    (filters.modelFamilies?.length || 0) +
    (filters.datasets?.length || 0) +
    (filters.dateRange.from || filters.dateRange.to ? 1 : 0) +
    (Object.keys(filters.metrics || {}).length)

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex flex-col gap-4">
        {/* Search and Main Controls */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search models, datasets, metrics..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
            />
          </div>

          {/* Filter Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                {/* Task Types */}
                <div>
                  <h4 className="font-medium mb-2">Task Types</h4>
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {availableTaskTypes.map((task) => (
                        <div key={task} className="flex items-center gap-2">
                          <Checkbox
                            checked={filters.taskTypes?.includes(task)}
                            onCheckedChange={(checked) => {
                              const newTasks = checked
                                ? [...(filters.taskTypes || []), task]
                                : filters.taskTypes?.filter((t) => t !== task) || []
                              handleFilterChange({ taskTypes: newTasks })
                            }}
                          />
                          <span className="text-sm">{getTaskDisplayName(task)}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Model Families */}
                <div>
                  <h4 className="font-medium mb-2">Model Families</h4>
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {availableModelFamilies.map((family) => (
                        <div key={family} className="flex items-center gap-2">
                          <Checkbox
                            checked={filters.modelFamilies?.includes(family)}
                            onCheckedChange={(checked) => {
                              const newFamilies = checked
                                ? [...(filters.modelFamilies || []), family]
                                : filters.modelFamilies?.filter((f) => f !== family) || []
                              handleFilterChange({ modelFamilies: newFamilies })
                            }}
                          />
                          <span className="text-sm">{getModelFamilyDisplayName(family)}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Date Range */}
                <div>
                  <h4 className="font-medium mb-2">Date Range</h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) =>
                          handleFilterChange({
                            dateRange: { ...filters.dateRange, from: date || undefined }
                          })
                        }
                        initialFocus
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) =>
                          handleFilterChange({
                            dateRange: { ...filters.dateRange, to: date || undefined }
                          })
                        }
                        initialFocus
                      />
                    </div>
                  </div>
                </div>

                {/* Metric Ranges */}
                <div>
                  <h4 className="font-medium mb-2">Metric Ranges</h4>
                  <div className="space-y-4">
                    {['accuracy', 'f1', 'bleu', 'perplexity'].map((metric) => (
                      <div key={metric} className="space-y-2">
                        <label className="text-sm capitalize">{metric}</label>
                        <Slider
                          defaultValue={[0, 100]}
                          max={100}
                          step={1}
                          onValueChange={(value) =>
                            handleFilterChange({
                              metrics: {
                                ...filters.metrics,
                                [metric]: [value[0] / 100, value[1] / 100]
                              }
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Export Button */}
          {onExportData && (
            <Button variant="outline" onClick={onExportData} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.taskTypes?.map((task) => (
              <Badge
                key={task}
                variant="secondary"
                className="gap-1"
              >
                {getTaskDisplayName(task)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    handleFilterChange({
                      taskTypes: filters.taskTypes?.filter((t) => t !== task)
                    })
                  }
                />
              </Badge>
            ))}
            {filters.modelFamilies?.map((family) => (
              <Badge
                key={family}
                variant="secondary"
                className="gap-1"
              >
                {getModelFamilyDisplayName(family)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    handleFilterChange({
                      modelFamilies: filters.modelFamilies?.filter((f) => f !== family)
                    })
                  }
                />
              </Badge>
            ))}
            {filters.dateRange.from && (
              <Badge variant="secondary" className="gap-1">
                From: {format(filters.dateRange.from, 'PP')}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    handleFilterChange({
                      dateRange: { ...filters.dateRange, from: undefined }
                    })
                  }
                />
              </Badge>
            )}
            {filters.dateRange.to && (
              <Badge variant="secondary" className="gap-1">
                To: {format(filters.dateRange.to, 'PP')}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    handleFilterChange({
                      dateRange: { ...filters.dateRange, to: undefined }
                    })
                  }
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
