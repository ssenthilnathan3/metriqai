import React, { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BenchmarkEntry, ModelFamily, ModelFamilyStats } from "@/types";
import {
  generateColorPalette,
  getModelFamilyDisplayName,
  formatMetric,
} from "@/lib/utils";

interface ModelFamilyRadarChartProps {
  data: BenchmarkEntry[];
  familyStats?: ModelFamilyStats[];
  selectedFamilies?: ModelFamily[];
  title?: string;
  maxFamilies?: number;
  className?: string;
  onError?: (error: string) => void;
}

export function ModelFamilyRadarChart({
  data,
  familyStats,
  selectedFamilies = [],
  title = "Model Family Performance Comparison",
  maxFamilies = 6,
  className,
}: ModelFamilyRadarChartProps) {
  const chartData = useMemo(() => {
    // Use provided family stats if available, otherwise compute from raw data
    if (familyStats && familyStats.length > 0) {
      let filtered = familyStats;
      if (selectedFamilies.length > 0) {
        filtered = familyStats.filter((stat) =>
          selectedFamilies.includes(stat.family),
        );
      }
      return filtered
        .sort((a, b) => b.model_count - a.model_count)
        .slice(0, maxFamilies);
    }
    // Compute family stats from raw benchmark entries
    const familyPerformance = new Map<
      ModelFamily,
      {
        metrics: Map<string, number[]>;
        modelCount: number;
        parameterCounts: number[];
      }
    >();
    data.forEach((entry) => {
      const family = entry.model_info.model_family;
      if (selectedFamilies.length > 0 && !selectedFamilies.includes(family)) {
        return;
      }
      if (!familyPerformance.has(family)) {
        familyPerformance.set(family, {
          metrics: new Map(),
          modelCount: 0,
          parameterCounts: [],
        });
      }
      const familyData = familyPerformance.get(family)!;
      familyData.modelCount += 1;
      if (entry.model_info.parameter_count) {
        familyData.parameterCounts.push(entry.model_info.parameter_count);
      }
      entry.evaluation_results.forEach((result) => {
        const metricName = result.metric_name;
        if (!familyData.metrics.has(metricName)) {
          familyData.metrics.set(metricName, []);
        }
        familyData.metrics.get(metricName)!.push(result.value);
      });
    });
    // Convert to radar chart data
    const radarData: Array<{
      family: ModelFamily;
      metrics: Record<string, number>;
      modelCount: number;
      avgParameterCount: number;
    }> = [];
    familyPerformance.forEach((stats, family) => {
      const avgMetrics: Record<string, number> = {};
      stats.metrics.forEach((values, metricName) => {
        if (values.length > 0) {
          avgMetrics[metricName] =
            values.reduce((sum, val) => sum + val, 0) / values.length;
        }
      });
      const avgParameterCount =
        stats.parameterCounts.length > 0
          ? stats.parameterCounts.reduce((sum, val) => sum + val, 0) /
            stats.parameterCounts.length
          : 0;
      radarData.push({
        family,
        metrics: avgMetrics,
        modelCount: stats.modelCount,
        avgParameterCount,
      });
    });
    return radarData
      .sort((a, b) => b.modelCount - a.modelCount)
      .slice(0, maxFamilies);
  }, [data, familyStats, selectedFamilies, maxFamilies]);

  const { radarMetrics, rechartsData } = useMemo(() => {
    if (!chartData.length) return { radarMetrics: [], rechartsData: [] };
    // Find common metrics across all families with valid data
    const allMetrics = new Set<string>();
    chartData.forEach((family) => {
      Object.keys(family.metrics).forEach((metric) => allMetrics.add(metric));
    });
    // Select most common metrics (up to 8 for readability)
    const metricCounts = new Map<string, number>();
    chartData.forEach((family) => {
      Object.keys(family.metrics).forEach((metric) => {
        metricCounts.set(metric, (metricCounts.get(metric) || 0) + 1);
      });
    });
    const commonMetrics = Array.from(metricCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([metric]) => metric)
      .filter((metric) => {
        // Ensure metric has valid data (non-zero range, at least two families)
        const values = chartData
          .map((family) => family.metrics[metric])
          .filter((val): val is number => val !== undefined);
        return values.length >= 2 && Math.max(...values) > Math.min(...values);
      });
    if (commonMetrics.length === 0) {
      return { radarMetrics: [], rechartsData: [] };
    }
    // Normalize values for radar chart (0-1 scale)
    const metricRanges = new Map<string, { min: number; max: number }>();
    commonMetrics.forEach((metric) => {
      const values = chartData
        .map((family) => family.metrics[metric])
        .filter((val): val is number => val !== undefined);
      if (values.length >= 2) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        metricRanges.set(metric, { min, max });
      }
    });
    // Prepare Recharts data: one object per metric
    const rechartsData = commonMetrics.map((metric) => {
      const dataPoint: Record<string, any> = { metric };
      chartData.forEach((family) => {
        const value = family.metrics[metric];
        const range = metricRanges.get(metric);
        const normalizedValue =
          value !== undefined && range && range.max !== range.min
            ? (value - range.min) / (range.max - range.min)
            : 0;
        dataPoint[family.family] = normalizedValue;
        dataPoint[`${family.family}_info`] = {
          family: getModelFamilyDisplayName(family.family),
          modelCount: family.modelCount,
          avgParameterCount:
            family.avgParameterCount > 0
              ? (family.avgParameterCount / 1e6).toFixed(1)
              : "Unknown",
        };
      });
      return dataPoint;
    });
    return { radarMetrics: commonMetrics, rechartsData };
  }, [chartData]);

  const colors = useMemo(
    () => generateColorPalette(chartData.length),
    [chartData],
  );

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="font-semibold text-base">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="mt-2">
              <p className="font-medium">{entry.name}</p>
              <p>{`Score: ${formatMetric(entry.value, "normalized")}`}</p>
              <p>{`Models: ${entry.payload[`${entry.name}_info`].modelCount}`}</p>
              <p>{`Avg Parameters: ${entry.payload[`${entry.name}_info`].avgParameterCount}${
                typeof entry.payload[`${entry.name}_info`].avgParameterCount ===
                "string"
                  ? ""
                  : "M"
              }`}</p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const topFamilies = useMemo(() => {
    return chartData
      .sort((a, b) => {
        // Sort by average normalized performance
        const avgA =
          Object.values(a.metrics).reduce((sum, val) => sum + (val || 0), 0) /
          Object.keys(a.metrics).length;
        const avgB =
          Object.values(b.metrics).reduce((sum, val) => sum + (val || 0), 0) /
          Object.keys(b.metrics).length;
        return avgB - avgA;
      })
      .slice(0, 3);
  }, [chartData]);

  if (
    !chartData.length ||
    radarMetrics.length === 0 ||
    rechartsData.length === 0
  ) {
    return (
      <Card
        className={`bg-white shadow-lg rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-xl ${className}`}
      >
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-2xl font-semibold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 mt-1">
            Comparative analysis of model families across multiple metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex items-center justify-center h-64 text-gray-500 text-lg">
            No sufficient data available for radar chart comparison
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
          Performance comparison across {radarMetrics.length} metrics for{" "}
          {chartData.length} model families
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="w-full space-y-4">
          <div className="w-full h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={rechartsData}
                outerRadius="70%"
                margin={{ top: 20, right: 40, bottom: 20, left: 40 }}
              >
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="metric"
                  tickFormatter={(metric) => metric}
                  fontSize={11}
                  stroke="#4b5563"
                />
                <PolarRadiusAxis
                  domain={[0, 1]}
                  tickCount={6}
                  fontSize={10}
                  stroke="#4b5563"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 10 }}
                />
                {chartData.map((familyData, index) => (
                  <Radar
                    key={familyData.family}
                    name={getModelFamilyDisplayName(familyData.family)}
                    dataKey={familyData.family}
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
                Top Performing Families
              </h4>
              <div className="space-y-2">
                {topFamilies.map((family, index) => (
                  <div
                    key={family.family}
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
                      <span className="font-medium text-purple-700 dark:text-purple-300">
                        {getModelFamilyDisplayName(family.family)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-600 dark:text-purple-400 font-mono text-xs">
                        {family.modelCount} models
                      </div>
                      {family.avgParameterCount > 0 && (
                        <div className="text-purple-500 dark:text-purple-500 text-xs">
                          Avg: {(family.avgParameterCount / 1e6).toFixed(1)}M
                          params
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                Metrics Analyzed
              </h4>
              <div className="grid grid-cols-2 gap-1 text-sm">
                {radarMetrics.map((metric, index) => (
                  <div
                    key={metric}
                    className="text-blue-700 dark:text-blue-300"
                  >
                    • {metric}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Values are normalized to 0-1 scale for comparison. Larger
                  areas indicate better overall performance.
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 <strong>How to read:</strong> Each colored area represents a
              model family's performance across multiple metrics. Larger areas
              indicate better overall performance. Compare shapes to see where
              different families excel.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
