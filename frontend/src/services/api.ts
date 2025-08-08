import { BenchmarkResponse, HealthResponse, CacheStatus } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        let errorData: any
        try {
          errorData = await response.json()
        } catch {
          errorData = { message: response.statusText }
        }

        throw new ApiError(
          errorData.detail || errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        )
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        0,
        error
      )
    }
  }

  // Health check
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health')
  }

  // Get benchmark data
  async getBenchmarks(forceRefresh: boolean = false): Promise<BenchmarkResponse> {
    const queryParams = forceRefresh ? '?force_refresh=true' : ''
    return this.request<BenchmarkResponse>(`/api/benchmarks${queryParams}`)
  }

  // Refresh benchmark data
  async refreshBenchmarks(): Promise<{ message: string; timestamp: string }> {
    return this.request('/api/refresh', {
      method: 'POST',
    })
  }

  // Get cache status
  async getCacheStatus(): Promise<CacheStatus> {
    return this.request<CacheStatus>('/api/cache-status')
  }

  // Utility method to check if API is reachable
  async isApiReachable(): Promise<boolean> {
    try {
      await this.getHealth()
      return true
    } catch {
      return false
    }
  }

  // Get API info
  async getApiInfo(): Promise<any> {
    return this.request('/')
  }
}

// Create singleton instance
export const apiService = new ApiService()

// Export individual functions for convenience
export const {
  getHealth,
  getBenchmarks,
  refreshBenchmarks,
  getCacheStatus,
  isApiReachable,
  getApiInfo
} = apiService

// Helper function to handle API errors in components
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

// Helper function to retry API calls with exponential backoff
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

// Helper to format API timestamps
export function formatApiTimestamp(timestamp: string): Date {
  return new Date(timestamp)
}

export default apiService
