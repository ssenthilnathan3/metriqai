import React, { useMemo } from "react";
import {
  LineChart,
  Line,
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
import { BenchmarkEntry, TaskType, TrendData } from "@/types";
import {
  generateColorPalette,
  getTaskDisplayName,
  formatMetric,
  formatDate,
} from "@/lib/utils";

interface TrendLineChartProps {
  data: BenchmarkEntry[];
  trendData?: TrendData[];
  taskTypes?: TaskType[];
  metricType?: string;
  title?: string;
  timeRange?: "month" | "quarter" | "year";
  className?: string;
}

export function TrendLineChart({
  data,
  trendData,
  taskTypes = [],
  metricType = "accuracy",
  title = "Performance Trends Over Time",
  timeRange = "year",
  className,
}: TrendLineChartProps) {
  const chartData = useMemo(() => {
    // Use provided trend data if available, otherwise compute from raw data
    if (trendData && trendData.length > 0) {
      return trendData
        .filter(
          (trend) =>
            trend.metric_name
              .toLowerCase()
              .includes(metricType.toLowerCase()) &&
            (taskTypes.length === 0 || taskTypes.includes(trend.task_type)),
        )
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
    }
    // Compute trend data from raw benchmark entries
    const timeGroupedData = new Map<
      string,
      Map<TaskType, { values: number[]; count: number; best: number }>
    >();
    data.forEach((entry) => {
      if (
        taskTypes.length > 0 &&
        !taskTypes.includes(entry.model_info.task_type)
      ) {
        return;
      }
      const createdAt = entry.model_info.created_at
        ? new Date(entry.model_info.created_at)
        : new Date();
      const timeKey = getTimeKey(createdAt, timeRange);
      const relevantResults = entry.evaluation_results.filter((result) =>
        result.metric_name.toLowerCase().includes(metricType.toLowerCase()),
      );
      relevantResults.forEach((result) => {
        if (!timeGroupedData.has(timeKey)) {
          timeGroupedData.set(timeKey, new Map());
        }
        const taskMap = timeGroupedData.get(timeKey)!;
        if (!taskMap.has(entry.model_info.task_type)) {
          taskMap.set(entry.model_info.task_type, {
            values: [],
            count: 0,
            best: 0,
          });
        }
        const taskData = taskMap.get(entry.model_info.task_type)!;
        taskData.values.push(result.value);
        taskData.count += 1;
        taskData.best = Math.max(taskData.best, result.value);
      });
    });
    // Convert to trend data format
    const trendResults: TrendData[] = [];
    timeGroupedData.forEach((taskMap, timeKey) => {
      taskMap.forEach((taskData, taskType) => {
        if (taskData.values.length > 0) {
          trendResults.push({
            date: timeKey,
            task_type: taskType,
            metric_name: metricType,
            avg_value:
              taskData.values.reduce((sum, val) => sum + val, 0) /
              taskData.values.length,
            model_count: taskData.count,
            best_value: taskData.best,
          });
        }
      });
    });
    return trendResults.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [data, trendData, taskTypes, metricType, timeRange]);

  // Prepare data for Recharts
  const rechartsData = useMemo(() => {
    // Group by date and create objects with task-specific avg and best values
    const dateMap = new Map<string, Record<string, any>>();
    chartData.forEach((item) => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { date: item.date });
      }
      const dateData = dateMap.get(item.date)!;
      const taskKey = getTaskDisplayName(item.task_type);
      dateData[`${taskKey}_avg`] = item.avg_value;
      dateData[`${taskKey}_best`] = item.best_value;
      dateData[`${taskKey}_count`] = item.model_count;
    });
    return Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [chartData]);

  // Y-axis domain to zoom in on small differences
  const yAxisDomain = useMemo(() => {
    if (!chartData.length) return [0, 1];
    const values = chartData.flatMap((item) => [
      item.avg_value,
      item.best_value,
    ]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const padding = (maxValue - minValue) * 0.05 || 0.01;
    return [Math.max(0, minValue - padding), maxValue + padding];
  }, [chartData]);

  // Generate lines for each task type
  const taskGroups = useMemo(() => {
    const tasks = new Set(chartData.map((item) => item.task_type));
    return Array.from(tasks).map((taskType, index) => ({
      taskType,
      color: generateColorPalette(tasks.size)[index],
      displayName: getTaskDisplayName(taskType),
    }));
  }, [chartData]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="font-semibold text-base">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="mt-2">
              <p className="font-medium">
                {entry.name.replace(/_(avg|best)$/, "")}
              </p>
              <p>{`${metricType}: ${formatMetric(entry.value, metricType)} (${entry.name.endsWith("_avg") ? "Avg" : "Best"})`}</p>
              {entry.name.endsWith("_avg") && (
                <p>{`Models: ${entry.payload[`${entry.name.replace("_avg", "")}_count`]}`}</p>
              )}
            </div>
          ))}
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
            Performance trends over time for {metricType}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex items-center justify-center h-64 text-gray-500 text-lg">
            No trend data available for the selected criteria
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
          Performance evolution over time for {metricType}
          {taskTypes.length > 0 && (
            <span>
              {" "}
              · {taskTypes.map((t) => getTaskDisplayName(t)).join(", ")}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="w-full h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rechartsData}
              margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
            >
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                fontSize={12}
                stroke="#4b5563"
                tickFormatter={(value) =>
                  timeRange === "month"
                    ? formatDate(value, "%b %Y")
                    : formatDate(value, "%Y")
                }
              >
                <Label
                  value="Time"
                  offset={-40}
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
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="left"
                wrapperStyle={{ paddingBottom: 10 }}
                formatter={(value) => value.replace(/_avg$/, "")}
              />
              {taskGroups.map(({ taskType, color, displayName }) => (
                <React.Fragment key={taskType}>
                  <Line
                    type="monotone"
                    dataKey={`${displayName}_avg`}
                    name={`${displayName} (Avg)`}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 4, stroke: "white", strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${displayName}_best`}
                    name={`${displayName} (Best)`}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    opacity={0.6}
                  />
                </React.Fragment>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-left">
          Solid lines: Average performance | Dashed lines: Best performance
        </div>
      </CardContent>
    </Card>
  );
}

function getTimeKey(
  date: Date,
  timeRange: "month" | "quarter" | "year",
): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  switch (timeRange) {
    case "month":
      return `${year}-${String(month + 1).padStart(2, "0")}-01`;
    case "quarter":
      const quarter = Math.floor(month / 3) + 1;
      return `${year}-Q${quarter}`;
    case "year":
      return `${year}-01-01`;
    default:
      return date.toISOString().split("T")[0];
  }
}
