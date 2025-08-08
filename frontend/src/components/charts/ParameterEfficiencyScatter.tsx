import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  Legend,
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
  formatNumber,
} from "@/lib/utils";

interface ParameterEfficiencyScatterProps {
  data: BenchmarkEntry[];
  taskType?: TaskType;
  metricType?: string;
  title?: string;
  minParameters?: number;
  className?: string;
}

export function ParameterEfficiencyScatter({
  data,
  taskType,
  metricType = "accuracy",
  title = "Parameter Efficiency Analysis",
  minParameters = 1000000, // 1M parameters minimum
  className,
}: ParameterEfficiencyScatterProps) {
  const chartData = useMemo(() => {
    // Filter data by task type and parameter count
    let filteredData = data.filter((entry) => {
      const hasParams =
        entry.model_info.parameter_count &&
        entry.model_info.parameter_count >= minParameters;
      const matchesTask = !taskType || entry.model_info.task_type === taskType;
      return hasParams && matchesTask;
    });
    // Extract performance and parameter data
    const scatterData = filteredData
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
          parameterCount: entry.model_info.parameter_count!,
          dataset: bestResult.dataset_name,
          downloads: entry.model_info.downloads || 0,
          efficiency:
            bestResult.value / (entry.model_info.parameter_count! / 1e6), // per million params
          size: entry.model_info.model_size,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    return scatterData;
  }, [data, taskType, metricType, minParameters]);

  // Group by family for different scatters
  const familyGroups = useMemo(() => {
    const groups = new Map<string, typeof chartData>();
    chartData.forEach((item) => {
      const family = item.family;
      if (!groups.has(family)) {
        groups.set(family, []);
      }
      groups.get(family)!.push(item);
    });
    return Array.from(groups.entries()).map(([family, items], index) => ({
      family: family.toUpperCase(),
      items,
      color: generateColorPalette(groups.size)[index],
    }));
  }, [chartData]);

  // Y-axis domain to zoom in on performance differences
  const yAxisDomain = useMemo(() => {
    if (!chartData.length) return [0, 1];
    const yValues = chartData.map((item) => item.performance);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const padding = (maxY - minY) * 0.05 || 0.01;
    return [Math.max(0, minY - padding), Math.min(1, maxY + padding)];
  }, [chartData]);

  // X-axis domain for logarithmic parameter count
  const xAxisDomain = useMemo(() => {
    if (!chartData.length) return [0, 100];
    const xValues = chartData.map((item) => item.parameterCount / 1e6);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    return [minX * 0.8, maxX * 1.2];
  }, [chartData]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="font-semibold text-base">{data.modelName}</p>
          <p>{`Parameters: ${formatNumber(data.parameterCount)}`}</p>
          <p>{`${metricType}: ${formatMetric(data.performance, metricType)}`}</p>
          <p>{`Family: ${data.family}`}</p>
          <p>{`Efficiency: ${data.efficiency.toFixed(3)}`}</p>
          <p>{`Dataset: ${data.dataset}`}</p>
          <p>{`Downloads: ${formatNumber(data.downloads)}`}</p>
        </div>
      );
    }
    return null;
  };

  const topEfficient = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.sort((a, b) => b.efficiency - a.efficiency).slice(0, 3);
  }, [chartData]);

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
            Parameter count vs performance analysis
            {taskType && ` for ${getTaskDisplayName(taskType)}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex items-center justify-center h-64 text-gray-500 text-lg">
            No data available with parameter information
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
          Parameter efficiency analysis - {chartData.length} models
          {taskType && ` for ${getTaskDisplayName(taskType)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="w-full space-y-4">
          <div className="w-full h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
              >
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis
                  dataKey="parameterCount"
                  type="number"
                  domain={xAxisDomain}
                  scale="log"
                  fontSize={12}
                  stroke="#4b5563"
                  tickFormatter={(value) => `${(value / 1e6).toFixed(1)}M`}
                >
                  <Label
                    value="Parameters (Millions)"
                    offset={-40}
                    position="bottom"
                    className="text-gray-700 font-medium"
                  />
                </XAxis>
                <YAxis
                  dataKey="performance"
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
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 10 }}
                />
                {familyGroups.map(({ family, items, color }) => (
                  <Scatter
                    key={family}
                    name={family}
                    data={items}
                    fill={color}
                    opacity={0.7}
                  >
                    {items.map((item) => (
                      <g key={item.modelId}>
                        <circle
                          cx={item.parameterCount / 1e6}
                          cy={item.performance}
                          r={
                            Math.min(
                              Math.max(Math.log10(item.downloads + 1) * 3, 8),
                              20,
                            ) / 2
                          }
                          fill={color}
                          stroke="rgba(0,0,0,0.3)"
                          strokeWidth={1}
                        />
                      </g>
                    ))}
                  </Scatter>
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-gray-500 text-left">
            Bubble size represents download count | Higher position = better
            performance | Left position = fewer parameters
            {topEfficient.length > 0 && (
              <span>
                {" "}
                | Most Efficient:{" "}
                {topEfficient[0].modelName.split("/").pop()?.substring(0, 20) ||
                  "Unknown"}
              </span>
            )}
          </div>
          {topEfficient.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Most Efficient Models (Performance per Million Parameters)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {topEfficient.map((model, index) => (
                  <div key={model.modelId} className="flex flex-col">
                    <span className="font-medium text-green-700 dark:text-green-300">
                      #{index + 1}{" "}
                      {model.modelName.split("/").pop()?.substring(0, 25)}
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      {formatMetric(model.performance, metricType)} /{" "}
                      {formatNumber(model.parameterCount)} params
                    </span>
                    <span className="text-green-500 dark:text-green-500 text-xs">
                      Efficiency: {model.efficiency.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
