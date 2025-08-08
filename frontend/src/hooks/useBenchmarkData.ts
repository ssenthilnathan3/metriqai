import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BenchmarkResponse, HealthResponse, CacheStatus } from "@/types";
import { apiService, handleApiError, retryApiCall } from "@/services/api";
import React, { useState, useCallback } from "react";

// Query keys
export const QUERY_KEYS = {
  health: ["health"] as const,
  benchmarks: ["benchmarks"] as const,
  cacheStatus: ["cache-status"] as const,
} as const;

// Custom hook for benchmark data
export function useBenchmarkData(forceRefresh: boolean = false) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.benchmarks, { forceRefresh }],
    queryFn: async () => {
      return retryApiCall(
        () => apiService.getBenchmarks(forceRefresh),
        3,
        2000,
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.benchmarks });
  }, [queryClient]);

  const forceRefetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.benchmarks });
    return queryClient.refetchQueries({
      queryKey: [...QUERY_KEYS.benchmarks, { forceRefresh: true }],
    });
  }, [queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? handleApiError(query.error) : null,
    isRefetching: query.isFetching && !query.isLoading,
    refetch,
    forceRefetch,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
  };
}

// Custom hook for health status
export function useHealthCheck(enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.health,
    queryFn: () => apiService.getHealth(),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 60 * 1000, // 1 minute
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 60 * 1000, // Check every minute
    refetchIntervalInBackground: false,
  });
}

// Custom hook for cache status
export function useCacheStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.cacheStatus,
    queryFn: () => apiService.getCacheStatus(),
    staleTime: 10 * 1000, // 10 seconds
    cacheTime: 30 * 1000, // 30 seconds
    retry: 1,
    refetchOnWindowFocus: true,
  });
}

// Custom hook for refreshing benchmark data
export function useRefreshBenchmarks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiService.refreshBenchmarks(),
    onSuccess: () => {
      // Invalidate and refetch benchmark data after successful refresh trigger
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.benchmarks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cacheStatus });
    },
    onError: (error) => {
      console.error("Failed to trigger refresh:", error);
    },
  });
}

// Composite hook that provides all benchmark-related functionality
export function useBenchmarkDataWithStatus() {
  const benchmarkData = useBenchmarkData();
  const healthCheck = useHealthCheck();
  const cacheStatus = useCacheStatus();
  const refreshMutation = useRefreshBenchmarks();

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  // Auto-refresh logic
  const autoRefresh = useCallback(async () => {
    if (!autoRefreshEnabled) return;

    try {
      const status = await apiService.getCacheStatus();
      if (!status.cache_valid) {
        await refreshMutation.mutateAsync();
      }
    } catch (error) {
      console.error("Auto-refresh failed:", error);
    }
  }, [autoRefreshEnabled, refreshMutation]);

  // Trigger auto-refresh every 5 minutes if enabled
  React.useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(autoRefresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, autoRefreshEnabled]);

  const isHealthy = healthCheck.data?.status === "healthy";
  const isDataStale = cacheStatus.data ? !cacheStatus.data.cache_valid : false;
  const dataCount = cacheStatus.data?.data_count || 0;

  return {
    // Benchmark data
    benchmarkData: benchmarkData.data,
    isLoading: benchmarkData.isLoading,
    isError: benchmarkData.isError,
    error: benchmarkData.error,
    isRefetching: benchmarkData.isRefetching,
    refetch: benchmarkData.refetch,
    forceRefetch: benchmarkData.forceRefetch,
    lastUpdated: benchmarkData.lastUpdated,

    // Health status
    isHealthy,
    healthError: healthCheck.error ? handleApiError(healthCheck.error) : null,

    // Cache status
    isDataStale,
    dataCount,
    cacheLastUpdated: cacheStatus.data?.last_updated
      ? new Date(cacheStatus.data.last_updated)
      : null,

    // Refresh functionality
    triggerRefresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
    refreshError: refreshMutation.error
      ? handleApiError(refreshMutation.error)
      : null,

    // Auto-refresh control
    autoRefreshEnabled,
    setAutoRefreshEnabled,

    // Combined loading state
    isAnyLoading:
      benchmarkData.isLoading || healthCheck.isLoading || cacheStatus.isLoading,

    // Combined error state
    hasAnyError:
      benchmarkData.isError || healthCheck.isError || cacheStatus.isError,
  };
}

// Hook for filtered and processed benchmark data
export function useProcessedBenchmarkData(filters?: {
  taskTypes?: string[];
  modelFamilies?: string[];
  datasets?: string[];
  searchQuery?: string;
}) {
  const { data: rawData, ...rest } = useBenchmarkData();

  const processedData = React.useMemo(() => {
    if (!rawData) return null;

    let filtered = rawData.data;

    // Apply filters if provided
    if (filters) {
      if (filters.taskTypes?.length) {
        filtered = filtered.filter((entry) =>
          filters.taskTypes!.includes(entry.model_info.task_type),
        );
      }

      if (filters.modelFamilies?.length) {
        filtered = filtered.filter((entry) =>
          filters.modelFamilies!.includes(entry.model_info.model_family),
        );
      }

      if (filters.datasets?.length) {
        filtered = filtered.filter((entry) =>
          entry.evaluation_results.some((result) =>
            filters.datasets!.includes(result.dataset_name),
          ),
        );
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (entry) =>
            entry.model_info.model_name.toLowerCase().includes(query) ||
            entry.model_info.model_id.toLowerCase().includes(query) ||
            entry.model_info.tags.some((tag) =>
              tag.toLowerCase().includes(query),
            ),
        );
      }
    }

    return {
      ...rawData,
      data: filtered,
      filteredCount: filtered.length,
      totalCount: rawData.data.length,
    };
  }, [rawData, filters]);

  return {
    data: processedData,
    ...rest,
  };
}

// Hook for real-time data updates
export function useRealTimeUpdates(intervalMs: number = 30000) {
  const queryClient = useQueryClient();
  const [isEnabled, setIsEnabled] = useState(false);

  React.useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cacheStatus });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isEnabled, intervalMs, queryClient]);

  return {
    isRealTimeEnabled: isEnabled,
    enableRealTime: () => setIsEnabled(true),
    disableRealTime: () => setIsEnabled(false),
    toggleRealTime: () => setIsEnabled((prev) => !prev),
  };
}

export default useBenchmarkData;
