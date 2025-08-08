# ML Benchmark Backend 🔧

FastAPI-based backend service for the ML Benchmark Dashboard. Fetches, processes, and serves machine learning benchmark data through a comprehensive REST API.

## 🚀 Features

- **FastAPI Framework**: Modern, high-performance Python web framework
- **Hugging Face Integration**: Direct API integration with HF Hub
- **Smart Data Processing**: Automatic data normalization and synthetic generation
- **Intelligent Caching**: Configurable TTL-based caching system
- **Comprehensive Analytics**: Statistical summaries, correlations, and leaderboards
- **Interactive API Docs**: Auto-generated Swagger/OpenAPI documentation
- **CORS Support**: Cross-origin resource sharing for frontend integration

## 📋 Requirements

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## ⚡ Quick Start

### 1. Setup Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Development Server

```bash
# Using the run script
python run.py

# Or directly with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API Base**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🏗️ Project Structure

```
backend/
├── main.py              # FastAPI application and routes
├── models.py            # Pydantic data models and schemas
├── data_fetcher.py      # Data fetching and processing logic
├── requirements.txt     # Python dependencies
├── run.py              # Development server runner
└── README.md           # This file
```

## 📊 API Endpoints

### Core Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/` | API information and available endpoints | JSON metadata |
| `GET` | `/health` | Health check and service status | Health status |
| `GET` | `/api/benchmarks` | Get comprehensive benchmark data | Full benchmark dataset |
| `POST` | `/api/refresh` | Trigger background data refresh | Operation status |
| `GET` | `/api/cache-status` | Current cache status and statistics | Cache information |

### Query Parameters

**`/api/benchmarks`**
- `force_refresh` (bool): Force refresh cached data

### Response Formats

#### Benchmark Data Response
```json
{
  "data": [
    {
      "model_info": {
        "model_id": "string",
        "model_name": "string",
        "model_family": "bert",
        "parameter_count": 110000000,
        "task_type": "text-classification",
        "downloads": 1000,
        "likes": 50,
        "created_at": "2024-01-15T10:30:00Z"
      },
      "evaluation_results": [
        {
          "metric_name": "accuracy",
          "metric_type": "accuracy",
          "value": 0.9234,
          "dataset_name": "imdb",
          "dataset_split": "test"
        }
      ]
    }
  ],
  "summary": {
    "total_models": 1500,
    "total_datasets": 45,
    "task_stats": [...],
    "dataset_stats": [...],
    "model_family_stats": [...],
    "trend_data": [...]
  },
  "correlations": [...],
  "leaderboards": [...]
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
HOST=0.0.0.0              # Server host
PORT=8000                 # Server port
RELOAD=true              # Auto-reload on changes
WORKERS=1                # Number of worker processes

# Data Fetching
MAX_MODELS_PER_TASK=50   # Models to fetch per task
CACHE_TTL_MINUTES=60     # Cache time-to-live
```

### Application Settings

Modify settings in `main.py`:

```python
# Cache configuration
benchmark_cache = {
    "ttl_minutes": 60,      # Cache duration
    "max_entries": 1000     # Maximum cache entries
}

# CORS settings
allow_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://yourdomain.com"
]
```

## 📦 Dependencies

### Core Dependencies
- **FastAPI**: Modern web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation and serialization
- **httpx**: Async HTTP client
- **pandas**: Data manipulation
- **numpy**: Numerical computations

### Development Dependencies
- **pytest**: Testing framework
- **black**: Code formatting
- **flake8**: Linting

## 🔍 Data Sources

### Primary: Hugging Face Hub API
- Model metadata and statistics
- Real evaluation results from model cards
- Download counts and popularity metrics

### Secondary: Synthetic Data Generation
- Realistic performance ranges by model family
- Fills gaps in evaluation data
- Ensures comprehensive benchmark coverage

### Supported Tasks
- Text Classification
- Image Classification
- Text Generation
- Question Answering
- Token Classification
- Translation
- Summarization
- Object Detection
- Speech Recognition
- And more...

## 📈 Data Processing Pipeline

### 1. Data Fetching
```python
# Fetch models by task from HF Hub
models = await fetcher.fetch_models_by_task("text-classification", limit=50)
```

### 2. Data Enrichment
- Extract model families from names/tags
- Parse parameter counts
- Normalize evaluation metrics
- Generate synthetic data for missing metrics

### 3. Statistical Analysis
- Compute summary statistics
- Generate correlation matrices
- Create leaderboards with efficiency scores
- Calculate performance trends

### 4. Caching & Serving
- Cache processed data with TTL
- Serve via REST API
- Background refresh capabilities

## 🐛 Debugging

### Enable Debug Logging
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Common Issues

**1. Import Errors**
```bash
# Ensure all dependencies are installed
pip install -r requirements.txt --force-reinstall
```

**2. Port Already in Use**
```bash
# Kill process using port 8000
lsof -ti:8000 | xargs kill -9
```

**3. Hugging Face API Limits**
```bash
# The service handles rate limits automatically with retry logic
# Check logs for rate limiting messages
```

## 🧪 Testing

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test benchmark data
curl http://localhost:8000/api/benchmarks

# Test cache status
curl http://localhost:8000/api/cache-status
```

### Automated Testing (if implemented)
```bash
pytest
```

## 📊 Performance Optimization

### Caching Strategy
- In-memory cache with configurable TTL
- Background refresh to avoid blocking requests
- Smart cache invalidation

### Data Processing
- Async HTTP requests for concurrent fetching
- Efficient pandas operations for data processing
- Lazy loading of model details

### API Performance
- Pydantic models for fast serialization
- Uvicorn ASGI server for high throughput
- Response compression for large datasets

## 🚀 Production Deployment

### Using Uvicorn
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Gunicorn + Uvicorn Workers
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Configuration
```bash
# Production settings
HOST=0.0.0.0
PORT=8000
WORKERS=4
RELOAD=false
LOG_LEVEL=info
```

## 🔐 Security Considerations

### CORS Configuration
- Configure allowed origins for production
- Limit to specific domains in production

### API Rate Limiting
- Implement rate limiting for public APIs
- Use API keys for authenticated access

### Input Validation
- All inputs validated with Pydantic models
- SQL injection protection (not applicable for this API)
- XSS protection via proper headers

## 📚 API Documentation

### Interactive Documentation
Visit `/docs` for Swagger UI with:
- Interactive API testing
- Request/response schemas
- Authentication examples

### Programmatic Access
```python
import requests

# Get benchmark data
response = requests.get("http://localhost:8000/api/benchmarks")
data = response.json()

# Force refresh
response = requests.get("http://localhost:8000/api/benchmarks?force_refresh=true")
```

## 🤝 Contributing

1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Include docstrings for public methods
4. Test API endpoints manually
5. Update this README for new features

### Code Style
```bash
# Format code
black .

# Check style
flake8 .
```

## 📞 Support

For backend-specific issues:
- Check the logs for detailed error messages
- Verify all dependencies are installed
- Ensure Python version compatibility
- Test API endpoints individually

---

**🔧 Happy coding with the ML Benchmark Backend!**