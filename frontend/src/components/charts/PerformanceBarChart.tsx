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
import { BenchmarkEntry, TaskType } from "@/types";
import {
  generateColorPalette,
  getTaskDisplayName,
  formatMetric,
} from "@/lib/utils";

interface PerformanceBarChartProps {
  data: BenchmarkEntry[];
  taskType?: TaskType;
  metricType?: string;
  title?: string;
  maxModels?: number;
  className?: string;
}

export function PerformanceBarChart({
  data,
  taskType,
  metricType = "accuracy",
  title = "Top Performing Models",
  maxModels = 15,
  className,
}: PerformanceBarChartProps) {
  const chartData = useMemo(() => {
    // Filter data by task type if specified
    let filteredData = data;
    if (taskType) {
      filteredData = data.filter(
        (entry) => entry.model_info.task_type === taskType,
      );
    }
    // Extract performance data for the specified metric
    const modelPerformance = filteredData
      .map((entry) => {
        const relevantResults = entry.evaluation_results.filter((result) =>
          result.metric_name.toLowerCase().includes(metricType.toLowerCase()),
        );
        if (relevantResults.length === 0) return null;
        // Use the best performance for this metric
        const bestResult = relevantResults.reduce((best, current) =>
          current.value > best.value ? current : best,
        );
        return {
          modelId: entry.model_info.model_id,
          modelName: entry.model_info.model_name || entry.model_info.model_id,
          family: entry.model_info.model_family,
          taskType: entry.model_info.task_type,
          performance: bestResult.value,
          dataset: bestResult.dataset_name,
          parameterCount: entry.model_info.parameter_count || 0,
          downloads: entry.model_info.downloads || 0,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    // Sort by performance (descending) and take top N
    const sortedData = modelPerformance
      .sort((a, b) => b.performance - a.performance)
      .slice(0, maxModels);
    return sortedData;
  }, [data, taskType, metricType, maxModels]);

  // Calculate Y-axis domain to zoom in on the range of accuracies
  const yAxisDomain = useMemo(() => {
    if (!chartData.length) return [0, 1];
    const performances = chartData.map((item) => item.performance);
    const minPerf = Math.min(...performances);
    const maxPerf = Math.max(...performances);
    // Add padding (e.g., 5% of range) to make differences more visible
    const padding = (maxPerf - minPerf) * 0.05 || 0.01;
    return [Math.max(0, minPerf - padding), maxPerf + padding];
  }, [chartData]);

  const colors = useMemo(
    () => generateColorPalette(chartData.length),
    [chartData],
  );

  // Custom Tooltip component for rich hover information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="font-semibold text-base">{label}</p>
          <p>{`${metricType}: ${formatMetric(data.performance, metricType)}`}</p>
          <p>{`Family: ${data.family}`}</p>
          <p>{`Dataset: ${data.dataset}`}</p>
          {data.parameterCount && (
            <p>{`Params: ${(data.parameterCount / 1e6).toFixed(1)}M`}</p>
          )}
          <p>{`Downloads: ${data.downloads.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

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
            {taskType
              ? `Performance data for ${getTaskDisplayName(taskType)}`
              : "Model performance comparison"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex items-center justify-center h-64 text-gray-500 text-lg">
            No data available for the selected criteria
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
          {taskType
            ? `Top ${chartData.length} models for ${getTaskDisplayName(taskType)} by ${metricType}`
            : `Top ${chartData.length} models by ${metricType}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="w-full h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 40, right: 20, left: 20, bottom: 100 }}
            >
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis
                dataKey="modelName"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="#4b5563"
                interval={0} // Show all labels to avoid skipping
              >
                <Label
                  value="Model"
                  offset={-80}
                  position="bottom"
                  className="text-gray-700 font-medium"
                />
              </XAxis>
              <YAxis
                domain={yAxisDomain}
                fontSize={12}
                stroke="#4b5563"
                tickFormatter={(value) => formatMetric(value, metricType)}
              >
                <Label
                  value={
                    metricType.charAt(0).toUpperCase() + metricType.slice(1)
                  }
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
                dataKey="performance"
                radius={[4, 4, 0, 0]}
                barSize={Math.max(20, 600 / chartData.length)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.modelId}
                    fill={colors[index % colors.length]}
                  />
                ))}
                {/* Add data labels on top of bars */}
                <LabelList
                  dataKey="performance"
                  position="top"
                  formatter={(value: number) => formatMetric(value, metricType)}
                  style={{ fontSize: 10, fill: "#1f2937", fontWeight: "500" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
