from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import logging
from datetime import datetime
from typing import Optional
import uvicorn

from models import BenchmarkResponse, HealthResponse
from data_fetcher import HuggingFaceDataFetcher

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ML Benchmark API",
    description="API for machine learning benchmark visualization and analytics",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global cache for benchmark data
benchmark_cache = {
    "data": None,
    "last_updated": None,
    "ttl_minutes": 60  # Cache for 1 hour
}


def is_cache_valid() -> bool:
    """Check if the cached data is still valid"""
    if benchmark_cache["data"] is None or benchmark_cache["last_updated"] is None:
        return False

    time_diff = datetime.utcnow() - benchmark_cache["last_updated"]
    return time_diff.total_seconds() < (benchmark_cache["ttl_minutes"] * 60)


async def refresh_cache():
    """Refresh the benchmark data cache"""
    try:
        logger.info("Starting cache refresh...")

        async with HuggingFaceDataFetcher() as fetcher:
            # Fetch benchmark data
            benchmark_entries = await fetcher.fetch_benchmark_data(max_models_per_task=30)

            if not benchmark_entries:
                logger.warning("No benchmark entries fetched")
                return

            # Compute statistics
            summary = fetcher.compute_summary_statistics(benchmark_entries)
            correlations = fetcher.compute_correlation_matrices(benchmark_entries)
            leaderboards = fetcher.generate_leaderboards(benchmark_entries)

            # Update cache
            benchmark_cache["data"] = BenchmarkResponse(
                data=benchmark_entries,
                summary=summary,
                correlations=correlations,
                leaderboards=leaderboards
            )
            benchmark_cache["last_updated"] = datetime.utcnow()

            logger.info(f"Cache refreshed successfully with {len(benchmark_entries)} entries")

    except Exception as e:
        logger.error(f"Error refreshing cache: {e}")
        raise


@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup"""
    logger.info("Starting ML Benchmark API...")
    try:
        # Initial cache load - don't fail startup if this fails
        await refresh_cache()
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        # Don't fail startup, just log the error
        logger.warning("Application started with initial cache load failure")


@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information"""
    return {
        "message": "ML Benchmark API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "benchmarks": "/api/benchmarks",
            "refresh": "/api/refresh"
        }
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    from datetime import timezone
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc),
        version="1.0.0"
    )


@app.get("/api/benchmarks", response_model=BenchmarkResponse)
async def get_benchmarks(force_refresh: bool = False):
    """
    Get ML benchmark data with comprehensive analytics

    - **force_refresh**: Force refresh of cached data (optional)
    """
    try:
        # Check if we need to refresh the cache
        if force_refresh or not is_cache_valid():
            await refresh_cache()

        if benchmark_cache["data"] is None:
            raise HTTPException(
                status_code=503,
                detail="Benchmark data is not available. Please try again later."
            )

        return benchmark_cache["data"]

    except Exception as e:
        logger.error(f"Error in get_benchmarks: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.post("/api/refresh")
async def refresh_benchmarks(background_tasks: BackgroundTasks):
    """
    Trigger a background refresh of benchmark data
    """
    try:
        from datetime import timezone
        background_tasks.add_task(refresh_cache)
        return {
            "message": "Benchmark data refresh started",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Error triggering refresh: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start refresh: {str(e)}"
        )


@app.get("/api/cache-status")
async def get_cache_status():
    """Get information about the current cache status"""
    return {
        "cache_valid": is_cache_valid(),
        "last_updated": benchmark_cache["last_updated"],
        "ttl_minutes": benchmark_cache["ttl_minutes"],
        "has_data": benchmark_cache["data"] is not None,
        "data_count": len(benchmark_cache["data"].data) if benchmark_cache["data"] else 0
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Global exception handler caught: {exc}")
    from datetime import timezone
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error_type": type(exc).__name__
        }
    )


@app.middleware("http")
async def log_requests(request, call_next):
    """Log all HTTP requests"""
    from datetime import timezone
    start_time = datetime.now(timezone.utc)

    try:
        # Process the request
        response = await call_next(request)

        # Calculate processing time
        process_time = (datetime.now(timezone.utc) - start_time).total_seconds()

        # Log the request
        logger.info(
            f"{request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"Time: {process_time:.3f}s"
        )

        return response
    except Exception as e:
        # Log the error and re-raise
        logger.error(f"Request processing error: {e}")
        raise


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
