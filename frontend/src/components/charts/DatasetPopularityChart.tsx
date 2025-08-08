import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BenchmarkEntry, DatasetStats, TaskType } from "@/types";
import {
  generateColorPalette,
  getTaskDisplayName,
  formatNumber,
} from "@/lib/utils";

interface DatasetPopularityChartProps {
  data: BenchmarkEntry[];
  datasetStats?: DatasetStats[];
  taskType?: TaskType;
  title?: string;
  chartType?: "bar" | "pie" | "treemap";
  maxDatasets?: number;
  className?: string;
}

export function DatasetPopularityChart({
  data,
  datasetStats,
  taskType,
  title = "Dataset Popularity",
  chartType = "bar",
  maxDatasets = 15,
  className,
}: DatasetPopularityChartProps) {
  const chartData = useMemo(() => {
    // Use provided dataset stats if available, otherwise compute from raw data
    if (datasetStats && datasetStats.length > 0) {
      let filtered = datasetStats;
      if (taskType) {
        filtered = datasetStats.filter((stat) => stat.task_type === taskType);
      }
      const sortedData = filtered
        .sort((a, b) => b.model_count - a.model_count)
        .slice(0, maxDatasets);
      console.log("Chart Data (from datasetStats):", sortedData); // Debug: Inspect data
      return sortedData;
    }
    // Compute dataset popularity from raw benchmark entries
    const datasetCounts = new Map<
      string,
      { count: number; taskTypes: Set<TaskType>; avgPerformance: number[] }
    >();
    data.forEach((entry) => {
      if (taskType && entry.model_info.task_type !== taskType) {
        return;
      }
      entry.evaluation_results.forEach((result) => {
        const datasetName = result.dataset_name;
        if (!datasetCounts.has(datasetName)) {
          datasetCounts.set(datasetName, {
            count: 0,
            taskTypes: new Set(),
            avgPerformance: [],
          });
        }
        const dataset = datasetCounts.get(datasetName)!;
        dataset.count += 1;
        dataset.taskTypes.add(entry.model_info.task_type);
        dataset.avgPerformance.push(result.value);
      });
    });
    // Convert to array and sort by popularity
    const popularityData = Array.from(datasetCounts.entries()).map(
      ([name, stats]) => ({
        dataset_name: name,
        task_type: Array.from(stats.taskTypes)[0] || "Unknown", // Fallback for empty task types
        model_count: stats.count,
        avg_performance: {
          overall:
            stats.avgPerformance.length > 0
              ? stats.avgPerformance.reduce((sum, val) => sum + val, 0) /
                stats.avgPerformance.length
              : 0,
        },
        best_performance: {
          overall:
            stats.avgPerformance.length > 0
              ? Math.max(...stats.avgPerformance)
              : 0,
        },
        worst_performance: {
          overall:
            stats.avgPerformance.length > 0
              ? Math.min(...stats.avgPerformance)
              : 0,
        },
      }),
    );
    const sortedData = popularityData
      .sort((a, b) => b.model_count - a.model_count)
      .slice(0, maxDatasets);
    console.log("Chart Data (computed):", sortedData); // Debug: Inspect data
    return sortedData;
  }, [data, datasetStats, taskType, maxDatasets]);

  const colors = useMemo(
    () => generateColorPalette(chartData.length),
    [chartData],
  );

  // Custom Tooltip for detailed hover information
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="font-semibold text-base">{data.dataset_name}</p>
          <p>{`Models: ${formatNumber(data.model_count)}`}</p>
          <p>{`Task: ${getTaskDisplayName(data.task_type)}`}</p>
          <p>{`Avg Performance: ${data.avg_performance.overall.toFixed(3)}`}</p>
          <p>{`Best Performance: ${data.best_performance.overall.toFixed(3)}`}</p>
          {chartType !== "bar" && (
            <p>{`Percentage: ${(data.percent * 100).toFixed(2)}%`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Dynamic Y-axis domain for bar chart to highlight differences
  const yAxisDomain = useMemo(() => {
    if (!chartData.length || chartType !== "bar") return [0, "auto"];
    const counts = chartData.map((item) => item.model_count);
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    const padding = (maxCount - minCount) * 0.05 || 1;
    return [Math.max(0, minCount - padding), maxCount + padding];
  }, [chartData, chartType]);

  const topDatasets = useMemo(() => chartData.slice(0, 5), [chartData]);

  if (!chartData.length) {
    return (
      <Card
        className={`bg-white shadow-lg rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-xl ${className}`}
      >
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-2xl font-semibold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 mt-1">
            Dataset usage across models
            {taskType && ` for ${getTaskDisplayName(taskType)}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex items-center justify-center h-64 text-gray-500 text-lg">
            No dataset usage data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-white shadow-lg rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-xl ${className}`}
    >
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-2xl font-semibold text-gray-900">
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500 mt-1">
          Most popular datasets by model count - showing top {chartData.length}{" "}
          datasets
          {taskType && ` for ${getTaskDisplayName(taskType)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="w-full space-y-6">
          <div className="w-full h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 40, right: 20, left: 20, bottom: 100 }}
                >
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="dataset_name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                    stroke="#4b5563"
                    interval={0}
                  >
                    <Label
                      value="Dataset"
                      offset={-80}
                      position="bottom"
                      className="text-gray-700 font-medium"
                    />
                  </XAxis>
                  <YAxis
                    domain={yAxisDomain}
                    fontSize={12}
                    stroke="#4b5563"
                    tickFormatter={formatNumber}
                  >
                    <Label
                      value="Number of Models"
                      angle={-90}
                      position="insideLeft"
                      className="text-gray-700 font-medium"
                      style={{ textAnchor: "middle" }}
                    />
                  </YAxis>
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                  />
                  <Bar
                    dataKey="model_count"
                    radius={[4, 4, 0, 0]}
                    barSize={Math.max(20, 600 / chartData.length)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={entry.dataset_name}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                    <LabelList
                      dataKey="model_count"
                      position="top"
                      formatter={formatNumber}
                      style={{
                        fontSize: 10,
                        fill: "#1f2937",
                        fontWeight: "500",
                      }}
                    />
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="model_count"
                    nameKey="dataset_name"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    innerRadius={chartType === "pie" ? "0%" : "40%"}
                    paddingAngle={chartType === "treemap" ? 0 : 2}
                    cornerRadius={chartType === "treemap" ? 10 : 0}
                    labelLine={chartType !== "treemap"}
                    label={({ dataset_name, percent }) =>
                      `${dataset_name} (${(percent * 100).toFixed(2)}%)`
                    }
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`dataset-${entry.dataset_name}`}
                        fill={colors[index % colors.length]}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                    {chartType === "pie" && (
                      <LabelList
                        dataKey="model_count"
                        position="inside"
                        formatter={(value: number) => formatNumber(value)}
                        style={{
                          fontSize: 10,
                          fill: "#ffffff",
                          fontWeight: "500",
                        }}
                      />
                    )}
                    {chartType !== "pie" && (
                      <Label
                        content={({ viewBox }) => (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-lg font-semibold text-gray-900"
                          >
                            <tspan x={viewBox.cx} dy="-0.6em">
                              {formatNumber(
                                chartData.reduce(
                                  (sum, d) => sum + d.model_count,
                                  0,
                                ),
                              )}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              dy="1.2em"
                              className="text-sm"
                            >
                              Total Models
                            </tspan>
                          </text>
                        )}
                      />
                    )}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
          {topDatasets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                  Top 3 Most Popular
                </h4>
                <div className="space-y-2">
                  {topDatasets.slice(0, 3).map((dataset, index) => (
                    <div
                      key={dataset.dataset_name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                                ? "bg-gray-400"
                                : "bg-amber-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="font-medium text-blue-700 dark:text-blue-300">
                          {dataset.dataset_name}
                        </span>
                      </div>
                      <span className="text-blue-600 dark:text-blue-400 font-mono">
                        {formatNumber(dataset.model_count)} models
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                  Dataset Statistics
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">
                      Total Datasets:
                    </span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {chartData.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">
                      Total Evaluations:
                    </span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {formatNumber(
                        chartData.reduce((sum, d) => sum + d.model_count, 0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">
                      Avg per Dataset:
                    </span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {Math.round(
                        chartData.reduce((sum, d) => sum + d.model_count, 0) /
                          chartData.length,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {chartType === "bar" && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 <strong>Insight:</strong> Popular datasets often become
                benchmarks for comparing model performance. The most used
                datasets typically have well-established evaluation protocols
                and represent important real-world tasks.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
