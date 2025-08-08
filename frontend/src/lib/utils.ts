import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B'
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M'
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatPercentage(num: number, decimals: number = 2): string {
  return `${(num * 100).toFixed(decimals)}%`
}

export function formatMetric(value: number, metricType: string): string {
  switch (metricType.toLowerCase()) {
    case 'accuracy':
    case 'f1':
    case 'precision':
    case 'recall':
    case 'auc':
    case 'iou':
      return formatPercentage(value, 3)
    case 'perplexity':
    case 'wer':
    case 'cer':
      return value.toFixed(2)
    case 'bleu':
    case 'rouge':
    case 'meteor':
      return value.toFixed(4)
    default:
      return value.toFixed(3)
  }
}

export function getMetricColor(value: number, metricType: string): string {
  // Higher is better for most metrics except perplexity, WER, CER
  const isLowerBetter = ['perplexity', 'wer', 'cer', 'mse', 'mae'].includes(metricType.toLowerCase())

  let performance: 'high' | 'medium' | 'low'

  if (isLowerBetter) {
    if (value < 0.1) performance = 'high'
    else if (value < 0.3) performance = 'medium'
    else performance = 'low'
  } else {
    if (value > 0.9) performance = 'high'
    else if (value > 0.7) performance = 'medium'
    else performance = 'low'
  }

  switch (performance) {
    case 'high':
      return 'text-green-600 dark:text-green-400'
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'low':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-muted-foreground'
  }
}

export function getPerformanceBadgeClass(value: number, metricType: string): string {
  const isLowerBetter = ['perplexity', 'wer', 'cer', 'mse', 'mae'].includes(metricType.toLowerCase())

  let performance: 'high' | 'medium' | 'low'

  if (isLowerBetter) {
    if (value < 0.1) performance = 'high'
    else if (value < 0.3) performance = 'medium'
    else performance = 'low'
  } else {
    if (value > 0.9) performance = 'high'
    else if (value > 0.7) performance = 'medium'
    else performance = 'low'
  }

  return `performance-${performance}`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getTaskDisplayName(taskType: string): string {
  const taskNames: Record<string, string> = {
    'image-classification': 'Image Classification',
    'text-classification': 'Text Classification',
    'token-classification': 'Token Classification',
    'text-generation': 'Text Generation',
    'text2text-generation': 'Text-to-Text Generation',
    'translation': 'Translation',
    'summarization': 'Summarization',
    'question-answering': 'Question Answering',
    'object-detection': 'Object Detection',
    'image-segmentation': 'Image Segmentation',
    'automatic-speech-recognition': 'Speech Recognition',
    'audio-classification': 'Audio Classification',
    'tabular-classification': 'Tabular Classification',
    'tabular-regression': 'Tabular Regression',
    'reinforcement-learning': 'Reinforcement Learning'
  }

  return taskNames[taskType] || taskType
}

export function getModelFamilyDisplayName(family: string): string {
  const familyNames: Record<string, string> = {
    'bert': 'BERT',
    'gpt': 'GPT',
    't5': 'T5',
    'roberta': 'RoBERTa',
    'distilbert': 'DistilBERT',
    'electra': 'ELECTRA',
    'deberta': 'DeBERTa',
    'albert': 'ALBERT',
    'resnet': 'ResNet',
    'vit': 'Vision Transformer',
    'efficientnet': 'EfficientNet',
    'mobilenet': 'MobileNet',
    'densenet': 'DenseNet',
    'inception': 'Inception',
    'clip': 'CLIP',
    'blip': 'BLIP',
    'whisper': 'Whisper',
    'wav2vec': 'Wav2Vec',
    'llama': 'LLaMA',
    'mistral': 'Mistral',
    'gemma': 'Gemma',
    'falcon': 'Falcon',
    'bloom': 'BLOOM'
  }

  return familyNames[family] || family.toUpperCase()
}

export function sortByMetric(data: any[], metricKey: string, ascending: boolean = false): any[] {
  return [...data].sort((a, b) => {
    const aValue = typeof a[metricKey] === 'number' ? a[metricKey] : parseFloat(a[metricKey]) || 0
    const bValue = typeof b[metricKey] === 'number' ? b[metricKey] : parseFloat(b[metricKey]) || 0

    return ascending ? aValue - bValue : bValue - aValue
  })
}

export function calculateEfficiencyScore(performance: number, parameterCount: number): number {
  if (!parameterCount || parameterCount === 0) return 0
  return performance / (parameterCount / 1e6) // Performance per million parameters
}

export function generateColorPalette(count: number): string[] {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6b7280', // gray
    '#14b8a6', // teal
    '#a855f7', // purple
    '#22c55e', // green
    '#eab308', // yellow
    '#dc2626', // red-600
    '#2563eb', // blue-600
  ]

  if (count <= colors.length) {
    return colors.slice(0, count)
  }

  // Generate additional colors if needed
  const additionalColors = []
  for (let i = colors.length; i < count; i++) {
    const hue = (i * 137.508) % 360 // Golden angle approximation
    additionalColors.push(`hsl(${hue}, 65%, 50%)`)
  }

  return [...colors, ...additionalColors]
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function downloadJSON(data: any, filename: string): void {
  const dataStr = JSON.stringify(data, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

  const exportFileDefaultName = filename.endsWith('.json') ? filename : `${filename}.json`

  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

export function downloadCSV(data: any[], filename: string): void {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent)
  const exportFileDefaultName = filename.endsWith('.csv') ? filename : `${filename}.csv`

  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}
