import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Label,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BenchmarkEntry, TaskStats, TaskType } from "@/types";
import {
  generateColorPalette,
  getTaskDisplayName,
  formatNumber,
} from "@/lib/utils";

interface TaskBreakdownChartProps {
  data: BenchmarkEntry[];
  taskStats?: TaskStats[];
  title?: string;
  chartType?: "sunburst" | "pie" | "donut";
  className?: string;
}

export function TaskBreakdownChart({
  data,
  taskStats,
  title = "Task Distribution",
  chartType = "sunburst",
  className,
}: TaskBreakdownChartProps) {
  const chartData = useMemo(() => {
    // Use provided task stats if available, otherwise compute from raw data
    if (taskStats && taskStats.length > 0) {
      return taskStats.sort((a, b) => b.model_count - a.model_count);
    }
    // Compute task statistics from raw benchmark entries
    const taskCounts = new Map<
      TaskType,
      {
        modelCount: number;
        datasetCount: Set<string>;
        familyCounts: Map<string, number>;
        avgMetrics: Map<string, number[]>;
      }
    >();
    data.forEach((entry) => {
      const taskType = entry.model_info.task_type;
      if (!taskCounts.has(taskType)) {
        taskCounts.set(taskType, {
          modelCount: 0,
          datasetCount: new Set(),
          familyCounts: new Map(),
          avgMetrics: new Map(),
        });
      }
      const taskData = taskCounts.get(taskType)!;
      taskData.modelCount += 1;
      // Track model family distribution
      const family = entry.model_info.model_family;
      taskData.familyCounts.set(
        family,
        (taskData.familyCounts.get(family) || 0) + 1,
      );
      // Track datasets and metrics
      entry.evaluation_results.forEach((result) => {
        taskData.datasetCount.add(result.dataset_name);
        const metricName = result.metric_name;
        if (!taskData.avgMetrics.has(metricName)) {
          taskData.avgMetrics.set(metricName, []);
        }
        taskData.avgMetrics.get(metricName)!.push(result.value);
      });
    });
    // Convert to TaskStats format
    const stats: TaskStats[] = [];
    taskCounts.forEach((taskData, taskType) => {
      const avgMetrics: Record<string, number> = {};
      taskData.avgMetrics.forEach((values, metricName) => {
        if (values.length > 0) {
          avgMetrics[metricName] =
            values.reduce((sum, val) => sum + val, 0) / values.length;
        }
      });
      // Get top models for this task
      const taskModels = data
        .filter((entry) => entry.model_info.task_type === taskType)
        .sort((a, b) => {
          const avgA =
            a.evaluation_results.reduce((sum, r) => sum + r.value, 0) /
            (a.evaluation_results.length || 1);
          const avgB =
            b.evaluation_results.reduce((sum, r) => sum + r.value, 0) /
            (b.evaluation_results.length || 1);
          return avgB - avgA;
        })
        .slice(0, 5)
        .map((entry) => entry.model_info.model_id);
      stats.push({
        task_type: taskType,
        model_count: taskData.modelCount,
        dataset_count: taskData.datasetCount.size,
        avg_metrics: avgMetrics,
        top_models: taskModels,
      });
    });
    const sortedStats = stats.sort((a, b) => b.model_count - a.model_count);
    console.log("Chart Data:", sortedStats); // Debug: Inspect chart data
    return sortedStats;
  }, [data, taskStats]);

  // Prepare data for sunburst (tasks and top families)
  const { taskChartData, familyChartData } = useMemo(() => {
    const taskData = chartData.map((task) => ({
      name: getTaskDisplayName(task.task_type),
      value: task.model_count,
      dataset_count: task.dataset_count,
      task_type: task.task_type,
    }));
    // For sunburst, prepare family breakdown for top 3 tasks
    const familyData: { name: string; value: number; parent: string }[] = [];
    if (chartType === "sunburst") {
      const topTasks = chartData.slice(0, 3);
      topTasks.forEach((task) => {
        const taskName = getTaskDisplayName(task.task_type);
        const taskModels = data.filter(
          (entry) => entry.model_info.task_type === task.task_type,
        );
        const familyCounts = new Map<string, number>();
        taskModels.forEach((entry) => {
          const family = entry.model_info.model_family;
          familyCounts.set(family, (familyCounts.get(family) || 0) + 1);
        });
        const topFamilies = Array.from(familyCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4);
        topFamilies.forEach(([family, count]) => {
          familyData.push({
            name: family.toUpperCase(),
            value: count,
            parent: taskName,
          });
        });
      });
    }
    console.log("Task Chart Data:", taskData); // Debug: Inspect task data
    console.log("Family Chart Data:", familyData); // Debug: Inspect family data
    return { taskChartData: taskData, familyChartData: familyData };
  }, [chartData, chartType, data]);

  const colors = useMemo(
    () =>
      generateColorPalette(
        Math.max(taskChartData.length, familyChartData.length),
      ),
    [taskChartData, familyChartData],
  );

  // Custom Tooltip for PieChart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="font-semibold text-base">{data.name}</p>
          <p>{`Models: ${formatNumber(data.value)}`}</p>
          {data.dataset_count && <p>{`Datasets: ${data.dataset_count}`}</p>}
          {data.parent && <p>{`Parent Task: ${data.parent}`}</p>}
          <p>{`Percentage: ${(data.percent * 100).toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  const taskInsights = useMemo(() => {
    if (!chartData.length) return null;
    const totalModels = chartData.reduce(
      (sum, task) => sum + task.model_count,
      0,
    );
    const totalDatasets = chartData.reduce(
      (sum, task) => sum + task.dataset_count,
      0,
    );
    const dominantTask = chartData[0];
    const diversityScore = chartData.length / Math.log(totalModels + 1); // Simple diversity metric
    const insights = {
      totalModels,
      totalDatasets,
      dominantTask,
      diversityScore,
      averageModelsPerTask: Math.round(totalModels / chartData.length),
      averageDatasetsPerTask: Math.round(totalDatasets / chartData.length),
    };
    console.log("Task Insights:", insights); // Debug: Inspect insights
    return insights;
  }, [chartData]);

  if (!chartData.length || !taskChartData.length) {
    return (
      <Card
        className={`bg-white shadow-lg rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-xl ${className}`}
      >
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-2xl font-semibold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 mt-1">
            Distribution of models across different AI tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex items-center justify-center h-64 text-gray-500 text-lg">
            No task distribution data available
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
          Distribution of {taskInsights?.totalModels} models across{" "}
          {chartData.length} AI task types
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="w-full space-y-6">
          <div className="w-full h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {chartType === "sunburst" ? (
                  <>
                    {/* Outer Pie: Tasks */}
                    <Pie
                      data={taskChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      innerRadius="50%"
                      paddingAngle={2}
                      labelLine
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(2)}%)`
                      }
                    >
                      {taskChartData.map((entry, index) => (
                        <Cell
                          key={`task-${entry.name}`}
                          fill={colors[index % colors.length]}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    {/* Inner Pie: Families for top tasks */}
                    <Pie
                      data={familyChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="45%"
                      innerRadius="30%"
                      paddingAngle={2}
                    >
                      {familyChartData.map((entry, index) => (
                        <Cell
                          key={`family-${entry.name}`}
                          fill={`${colors[index % colors.length]}80`} // Add transparency
                          stroke="#ffffff"
                          strokeWidth={1}
                        />
                      ))}
                      <LabelList
                        dataKey="name"
                        position="inside"
                        formatter={(value: string) => value}
                        style={{
                          fontSize: 10,
                          fill: "#1f2937",
                          fontWeight: "400",
                        }}
                      />
                    </Pie>
                  </>
                ) : (
                  <Pie
                    data={taskChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    innerRadius={chartType === "donut" ? "60%" : "0%"}
                    paddingAngle={2}
                    labelLine
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(2)}%)`
                    }
                  >
                    {taskChartData.map((entry, index) => (
                      <Cell
                        key={`task-${entry.name}`}
                        fill={colors[index % colors.length]}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                    {chartType === "donut" && (
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
                              {formatNumber(taskInsights?.totalModels || 0)}
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
                )}
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {taskInsights && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-3">
                  Most Popular Task
                </h4>
                <div className="space-y-2">
                  <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                    {getTaskDisplayName(taskInsights.dominantTask.task_type)}
                  </div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">
                    {formatNumber(taskInsights.dominantTask.model_count)} models
                    (
                    {Math.round(
                      (taskInsights.dominantTask.model_count /
                        taskInsights.totalModels) *
                        100,
                    )}
                    %)
                  </div>
                  <div className="text-xs text-indigo-500 dark:text-indigo-500">
                    {taskInsights.dominantTask.dataset_count} datasets used
                  </div>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-3">
                  Task Diversity
                </h4>
                <div className="space-y-2">
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {chartData.length} Task Types
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">
                    Avg: {taskInsights.averageModelsPerTask} models/task
                  </div>
                  <div className="text-xs text-emerald-500 dark:text-emerald-500">
                    Diversity score: {taskInsights.diversityScore.toFixed(1)}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3">
                  Coverage Stats
                </h4>
                <div className="space-y-2">
                  <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    {formatNumber(taskInsights.totalDatasets)} Datasets
                  </div>
                  <div className="text-sm text-amber-600 dark:text-amber-400">
                    Avg: {taskInsights.averageDatasetsPerTask} datasets/task
                  </div>
                  <div className="text-xs text-amber-500 dark:text-amber-500">
                    Total evaluations: {formatNumber(taskInsights.totalModels)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Top 5 Tasks by Model Count
              </h4>
              <div className="space-y-2 text-sm">
                {chartData.slice(0, 5).map((task, index) => (
                  <div
                    key={task.task_type}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {getTaskDisplayName(task.task_type)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-gray-600 dark:text-gray-400">
                        {formatNumber(task.model_count)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {task.dataset_count} datasets
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                💡 <strong>Understanding Task Distribution:</strong>
                <br />
                {chartType === "sunburst" &&
                  "The chart shows tasks (outer ring) and their top model families (inner ring). "}
                {chartType === "donut" &&
                  "The donut chart displays proportional task distribution with total count in center. "}
                {chartType === "pie" &&
                  "The pie chart shows relative popularity of each AI task type. "}
                Larger segments indicate more active research areas with higher
                model development.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
