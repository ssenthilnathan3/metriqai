import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  RefreshCw,
  TrendingUp,
  BarChart3,
  ScatterChart,
  PieChart,
  Radar,
  Target,
  Database,
  Activity,
  Clock,
  Users,
  Zap,
} from "lucide-react";

import { PerformanceBarChart } from "@/components/charts/PerformanceBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { ParameterEfficiencyScatter } from "@/components/charts/ParameterEfficiencyScatter";
import { CorrelationHeatmap } from "@/components/charts/CorrelationHeatmap";
import { DatasetPopularityChart } from "@/components/charts/DatasetPopularityChart";
import { ModelFamilyRadarChart } from "@/components/charts/ModelFamilyRadarChart";
import { TaskBreakdownChart } from "@/components/charts/TaskBreakdownChart";

import { useBenchmarkDataWithStatus } from "@/hooks/useBenchmarkData";
import {
  formatNumber,
  formatDateTime,
  getTaskDisplayName,
  getModelFamilyDisplayName,
} from "@/lib/utils";
import { TaskType, ModelFamily } from "@/types";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  className?: string;
}

function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={`metric-card ${className}`}>
      <CardContent className="p-6 truncate">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
            {trend && (
              <div
                className={`flex items-center text-xs ${
                  trend.direction === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {trend.value}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorMessage({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <Card className="border-destructive">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-destructive">
              Error Loading Data
            </h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          {retry && (
            <Button onClick={retry} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTask, setSelectedTask] = useState<TaskType | undefined>();
  const [selectedFamilies, setSelectedFamilies] = useState<ModelFamily[]>([]);

  const {
    benchmarkData,
    isLoading,
    error,
    isRefetching,
    forceRefetch,
    lastUpdated,
    isHealthy,
    isDataStale,
    triggerRefresh,
    isRefreshing,
  } = useBenchmarkDataWithStatus();

  const statistics = useMemo(() => {
    if (!benchmarkData) return null;

    const summary = benchmarkData.summary;
    const data = benchmarkData.data;

    // Calculate additional statistics
    const avgParameterCount =
      data
        .filter((entry) => entry.model_info.parameter_count)
        .reduce(
          (sum, entry) => sum + (entry.model_info.parameter_count || 0),
          0,
        ) / data.filter((entry) => entry.model_info.parameter_count).length;

    const totalDownloads = data.reduce(
      (sum, entry) => sum + (entry.model_info.downloads || 0),
      0,
    );
    const avgDownloads = totalDownloads / data.length;

    const uniqueFamilies = new Set(
      data.map((entry) => entry.model_info.model_family),
    ).size;
    const totalEvaluations = data.reduce(
      (sum, entry) => sum + entry.evaluation_results.length,
      0,
    );

    return {
      totalModels: summary.total_models,
      totalDatasets: summary.total_datasets,
      totalEvaluations,
      uniqueFamilies,
      avgParameterCount,
      totalDownloads,
      avgDownloads,
      lastUpdated: summary.last_updated,
      topTask: summary.task_stats.reduce(
        (max, task) => (task.model_count > max.model_count ? task : max),
        summary.task_stats[0],
      ),
      topFamily: summary.model_family_stats.reduce(
        (max, family) => (family.model_count > max.model_count ? family : max),
        summary.model_family_stats[0],
      ),
    };
  }, [benchmarkData]);

  const taskOptions = useMemo(() => {
    if (!benchmarkData) return [];
    return benchmarkData.summary.task_stats
      .sort((a, b) => b.model_count - a.model_count)
      .map((task) => task.task_type);
  }, [benchmarkData]);

  const familyOptions = useMemo(() => {
    if (!benchmarkData) return [];
    return benchmarkData.summary.model_family_stats
      .sort((a, b) => b.model_count - a.model_count)
      .slice(0, 10) // Top 10 families for performance
      .map((family) => family.family);
  }, [benchmarkData]);

  if (isLoading && !benchmarkData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <LoadingSpinner size="xl" />
          <h2 className="text-2xl font-semibold">Loading ML Benchmark Data</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Fetching the latest machine learning benchmark data from multiple
            sources. This may take a few moments...
          </p>
        </div>
      </div>
    );
  }

  if (error && !benchmarkData) {
    return (
      <div className="container mx-auto p-6">
        <ErrorMessage error={error} retry={() => forceRefetch()} />
      </div>
    );
  }

  if (!benchmarkData || !statistics) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            ML Benchmark Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of machine learning model performance across
            tasks and datasets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`status-${isHealthy ? "online" : "offline"}`}>
              API {isHealthy ? "Online" : "Offline"}
            </div>
            {isDataStale && <Badge variant="warning">Data Stale</Badge>}
            {lastUpdated && (
              <span className="text-muted-foreground">
                Updated {formatDateTime(lastUpdated)}
              </span>
            )}
          </div>

          <Button
            onClick={() => triggerRefresh()}
            disabled={isRefreshing || isRefetching}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing || isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Models"
          value={formatNumber(statistics.totalModels)}
          subtitle={`Across ${statistics.uniqueFamilies} model families`}
          icon={<Users className="w-5 h-5 text-primary" />}
        />
        <StatsCard
          title="Datasets"
          value={formatNumber(statistics.totalDatasets)}
          subtitle={`${formatNumber(statistics.totalEvaluations)} total evaluations`}
          icon={<Database className="w-5 h-5 text-primary" />}
        />
        <StatsCard
          title="Most Popular Task"
          value={getTaskDisplayName(statistics.topTask.task_type)}
          subtitle={`${formatNumber(statistics.topTask.model_count)} models`}
          icon={<Target className="w-5 h-5 text-primary" />}
        />
        <StatsCard
          title="Top Model Family"
          value={getModelFamilyDisplayName(statistics.topFamily.family)}
          subtitle={`${formatNumber(statistics.topFamily.model_count)} models`}
          icon={<Zap className="w-5 h-5 text-primary" />}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <ScatterChart className="w-4 h-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <PerformanceBarChart
              data={benchmarkData.data}
              title="Top Performing Models"
              maxModels={15}
              className="chart-container"
            />
            <TaskBreakdownChart
              data={benchmarkData.data}
              taskStats={benchmarkData.summary.task_stats}
              chartType="donut"
              className="chart-container"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DatasetPopularityChart
              data={benchmarkData.data}
              datasetStats={benchmarkData.summary.dataset_stats}
              maxDatasets={12}
              className="chart-container"
            />
            <TrendLineChart
              data={benchmarkData.data}
              trendData={benchmarkData.summary.trend_data}
              taskTypes={taskOptions.slice(0, 3)}
              className="chart-container"
            />
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Task Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Filter by Task Type</CardTitle>
              <CardDescription>
                Select a specific task to analyze performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedTask === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTask(undefined)}
                >
                  All Tasks
                </Button>
                {taskOptions.slice(0, 8).map((task) => (
                  <Button
                    key={task}
                    variant={selectedTask === task ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTask(task)}
                  >
                    {getTaskDisplayName(task)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <PerformanceBarChart
              data={benchmarkData.data}
              taskType={selectedTask}
              title="Model Performance Ranking"
              maxModels={20}
              className="chart-container"
            />
            <ParameterEfficiencyScatter
              data={benchmarkData.data}
              taskType={selectedTask}
              title="Parameter Efficiency"
              className="chart-container"
            />
          </div>

          <TrendLineChart
            data={benchmarkData.data}
            trendData={benchmarkData.summary.trend_data}
            taskTypes={selectedTask ? [selectedTask] : taskOptions.slice(0, 4)}
            title="Performance Trends Over Time"
            className="chart-container"
          />
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <CorrelationHeatmap
              correlationData={benchmarkData.correlations}
              taskType={selectedTask}
              className="chart-container"
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <TaskBreakdownChart
              data={benchmarkData.data}
              taskStats={benchmarkData.summary.task_stats}
              chartType="sunburst"
              className="chart-container col-span-2"
            />
            <DatasetPopularityChart
              data={benchmarkData.data}
              taskType={selectedTask}
              chartType="pie"
              maxDatasets={10}
              className="chart-container"
            />
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Key Insights Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Leader
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-600">
                    {getModelFamilyDisplayName(statistics.topFamily.family)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Most represented model family with{" "}
                    {formatNumber(statistics.topFamily.model_count)} models
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Popular Benchmark
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-blue-600">
                    {benchmarkData.summary.dataset_stats[0]?.dataset_name ||
                      "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Most evaluated dataset with{" "}
                    {formatNumber(
                      benchmarkData.summary.dataset_stats[0]?.model_count || 0,
                    )}{" "}
                    models
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Model Scale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-purple-600">
                    {statistics.avgParameterCount
                      ? `${(statistics.avgParameterCount / 1e6).toFixed(1)}M`
                      : "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Average parameter count across all models
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Leaderboards</CardTitle>
                <CardDescription>
                  Best performing models across different tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benchmarkData.leaderboards
                    .slice(0, 5)
                    .map((leaderboard, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-primary pl-4"
                      >
                        <div className="font-semibold">
                          {getTaskDisplayName(leaderboard.task_type)} -{" "}
                          {leaderboard.dataset_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Winner:{" "}
                          {leaderboard.entries[0]?.model_info.model_name
                            .split("/")
                            .pop() || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {leaderboard.metric_name}:{" "}
                          {leaderboard.entries[0]?.primary_metric.value.toFixed(
                            4,
                          ) || "N/A"}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficiency Champions</CardTitle>
                <CardDescription>
                  Models with best performance per parameter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benchmarkData.leaderboards
                    .flatMap((board) => board.entries)
                    .filter(
                      (entry) =>
                        entry.efficiency_score && entry.efficiency_score > 0,
                    )
                    .sort(
                      (a, b) =>
                        (b.efficiency_score || 0) - (a.efficiency_score || 0),
                    )
                    .slice(0, 5)
                    .map((entry, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-green-500 pl-4"
                      >
                        <div className="font-semibold">
                          {entry.model_info.model_name.split("/").pop() ||
                            "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Family:{" "}
                          {getModelFamilyDisplayName(
                            entry.model_info.model_family,
                          )}
                        </div>
                        <div className="text-xs text-green-600 font-mono">
                          Efficiency: {entry.efficiency_score?.toFixed(3)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Quality Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Data Quality & Coverage</CardTitle>
              <CardDescription>
                Analysis of the benchmark data completeness and quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(statistics.totalEvaluations)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Evaluations
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(
                      (benchmarkData.data.filter(
                        (e) => e.model_info.parameter_count,
                      ).length /
                        benchmarkData.data.length) *
                        100,
                    )}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Models w/ Params
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(statistics.totalDownloads)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Downloads
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(
                      statistics.totalEvaluations / statistics.totalModels,
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Evals/Model
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Dashboard;
