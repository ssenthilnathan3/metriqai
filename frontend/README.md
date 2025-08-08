# ML Benchmark Frontend 🎨

Modern React TypeScript frontend for the ML Benchmark Dashboard. Features interactive charts, responsive design, and comprehensive data visualization powered by Plotly.js and shadcn/ui.

## 🚀 Features

- **React 18**: Latest React with TypeScript for type safety
- **Vite**: Lightning-fast build tool and development server
- **shadcn/ui**: Beautiful, accessible UI components
- **Plotly.js**: Interactive, publication-quality charts
- **React Query**: Powerful data fetching and caching
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first, works on all devices

## 📋 Requirements

- Node.js 18 or higher
- npm or yarn package manager
- Modern web browser with ES6 support

## ⚡ Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Setup

```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at **http://localhost:3000**

## 🏗️ Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui base components
│   │   └── charts/       # Chart visualization components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service layer
│   ├── types/            # TypeScript type definitions
│   ├── lib/              # Utility functions
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── globals.css       # Global styles and CSS variables
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── vite.config.ts        # Vite build configuration
└── README.md            # This file
```

## 📊 Chart Components

### 1. Performance Bar Chart
- **Location**: `src/components/charts/PerformanceBarChart.tsx`
- **Purpose**: Top performing models comparison
- **Features**: Interactive tooltips, model filtering, export options

### 2. Trend Line Chart
- **Location**: `src/components/charts/TrendLineChart.tsx`
- **Purpose**: Performance evolution over time
- **Features**: Multi-series support, zoom/pan, date filtering

### 3. Parameter Efficiency Scatter
- **Location**: `src/components/charts/ParameterEfficiencyScatter.tsx`
- **Purpose**: Model size vs accuracy analysis
- **Features**: Bubble sizes, efficiency scoring, logarithmic scaling

### 4. Correlation Heatmap
- **Location**: `src/components/charts/CorrelationHeatmap.tsx`
- **Purpose**: Metric relationship visualization
- **Features**: Color coding, correlation strength, interpretations

### 5. Dataset Popularity Chart
- **Location**: `src/components/charts/DatasetPopularityChart.tsx`
- **Purpose**: Most used benchmarking datasets
- **Features**: Multiple chart types (bar/pie/treemap), popularity insights

### 6. Model Family Radar Chart
- **Location**: `src/components/charts/ModelFamilyRadarChart.tsx`
- **Purpose**: Multi-dimensional family comparison
- **Features**: Normalized metrics, family selection, performance areas

### 7. Task Breakdown Chart
- **Location**: `src/components/charts/TaskBreakdownChart.tsx`
- **Purpose**: AI task distribution visualization
- **Features**: Sunburst/pie/donut views, hierarchical data, task insights

## 🎨 UI Components

### Core UI Components
- **Button**: Versatile button component with variants
- **Card**: Container component for content sections
- **Badge**: Status and category indicators
- **Tabs**: Navigation between different views
- **Loading Spinner**: Loading states with different sizes

### Chart Features
- **Interactive Tooltips**: Detailed hover information
- **Export Options**: Save charts as PNG/SVG
- **Responsive Design**: Adapts to screen sizes
- **Theme Support**: Light/dark mode ready
- **Loading States**: Skeleton loading for better UX

## 🔧 Configuration

### Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Application Settings
VITE_APP_TITLE="ML Benchmark Dashboard"
VITE_APP_DESCRIPTION="Comprehensive ML performance analysis"

# Feature Flags
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_ANALYTICS=false

# Chart Configuration
VITE_DEFAULT_CHART_HEIGHT=500
VITE_MAX_CHART_POINTS=1000

# Performance Settings
VITE_LAZY_LOAD_CHARTS=true
VITE_AUTO_REFRESH_INTERVAL=300000
```

### Tailwind Configuration

The project uses a custom Tailwind configuration with:
- **CSS Variables**: For theme switching
- **Custom Colors**: Semantic color system
- **Typography**: Inter font family
- **Animations**: Custom chart animations
- **Components**: Utility classes for charts

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 640px and below
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px and above
- **Large Desktop**: 1440px and above

### Chart Responsiveness
- Charts automatically resize based on container
- Mobile-optimized tooltips and interactions
- Collapsible sidebars for small screens
- Touch-friendly interfaces

## ⚡ Performance Optimization

### Code Splitting
- Lazy loading of chart components
- Dynamic imports for heavy libraries
- Route-based code splitting

### Data Management
- React Query for intelligent caching
- Background refetching
- Optimistic updates
- Error boundaries

### Bundle Optimization
- Tree shaking for unused code
- Modern ES modules
- Efficient chunk splitting
- Asset optimization

## 🧪 Development

### Available Scripts

```bash
# Development server with HMR
npm run dev

# Type checking
npm run tsc

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Tools
- **React DevTools**: Component inspection
- **React Query DevTools**: Data fetching debugging
- **TypeScript**: Type checking and IntelliSense
- **ESLint**: Code linting and formatting

### Adding New Charts

1. **Create Component**
```tsx
// src/components/charts/NewChart.tsx
import React from 'react'
import Plot from 'react-plotly.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function NewChart({ data, title }: NewChartProps) {
  // Chart implementation
}
```

2. **Add to Dashboard**
```tsx
// src/components/Dashboard.tsx
import { NewChart } from '@/components/charts/NewChart'

// Use in component
<NewChart data={benchmarkData.data} title="New Analysis" />
```

3. **Export Utilities**
```tsx
// src/lib/utils.ts
export function processNewChartData(data: BenchmarkEntry[]) {
  // Data processing logic
}
```

## 🎯 API Integration

### Service Layer
```typescript
// src/services/api.ts
export const apiService = {
  getBenchmarks: () => Promise<BenchmarkResponse>,
  refreshData: () => Promise<void>,
  getHealthStatus: () => Promise<HealthResponse>
}
```

### Custom Hooks
```typescript
// src/hooks/useBenchmarkData.ts
export function useBenchmarkData() {
  return useQuery({
    queryKey: ['benchmarks'],
    queryFn: () => apiService.getBenchmarks()
  })
}
```

### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Retry mechanisms
- Fallback UI states

## 📊 Chart Library Integration

### Plotly.js Configuration
```typescript
const config = {
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
  toImageButtonOptions: {
    format: 'png',
    filename: 'chart-export',
    height: 600,
    width: 1000,
    scale: 2
  }
}
```

### Chart Themes
- Consistent color palettes
- Accessible color schemes
- Dark/light mode support
- Custom CSS variables

## 🚀 Production Build

### Build Process
```bash
# Create production build
npm run build

# Output directory: dist/
# - Optimized JavaScript bundles
# - Minified CSS
# - Optimized assets
# - Source maps
```

### Deployment Options

#### Static Hosting
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: Push to gh-pages branch

#### Docker
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Server Configuration
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔍 Debugging

### Development Tools
- Browser DevTools for DOM inspection
- React DevTools for component debugging
- Network tab for API monitoring
- Console logs for error tracking

### Common Issues

**1. Chart Not Rendering**
```bash
# Check Plotly.js import
# Verify data format
# Check container dimensions
```

**2. API Connection Issues**
```bash
# Verify VITE_API_BASE_URL
# Check CORS configuration
# Test backend availability
```

**3. Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🧪 Testing

### Component Testing (if implemented)
```bash
npm run test
```

### Manual Testing Checklist
- [ ] All charts render correctly
- [ ] API data loads properly
- [ ] Responsive design works
- [ ] Export functions work
- [ ] Error states display
- [ ] Loading states show

## 🤝 Contributing

### Code Style
- Use TypeScript for all components
- Follow React functional component patterns
- Implement proper error boundaries
- Add proper TypeScript types

### Component Guidelines
```tsx
interface ComponentProps {
  data: BenchmarkEntry[]
  title?: string
  className?: string
}

export function Component({ data, title, className }: ComponentProps) {
  // Implementation
}
```

### Commit Guidelines
- Use conventional commits
- Include component/feature scope
- Add proper descriptions

## 🎨 Styling

### CSS Variables
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
}
```

### Utility Classes
```css
.chart-container {
  @apply w-full h-full min-h-[400px] bg-card rounded-lg border p-4;
}

.metric-card {
  @apply bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20;
}
```

## 📞 Support

For frontend-specific issues:
- Check browser console for errors
- Verify API connectivity
- Test with different browsers
- Check responsive design
- Validate TypeScript compilation

---

**🎨 Beautiful visualizations with the ML Benchmark Frontend!**