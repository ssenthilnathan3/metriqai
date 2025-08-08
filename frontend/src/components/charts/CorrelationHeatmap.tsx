import React, { useMemo } from "react";
import Plot from "react-plotly.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CorrelationMatrix, TaskType } from "@/types";
import { getTaskDisplayName } from "@/lib/utils";

interface CorrelationHeatmapProps {
  correlationData: CorrelationMatrix[];
  taskType?: TaskType;
  title?: string;
  showValues?: boolean;
  className?: string;
}

export function CorrelationHeatmap({
  correlationData,
  taskType,
  title = "Metric Correlations",
  showValues = true,
  className,
}: CorrelationHeatmapProps) {
  const chartData = useMemo(() => {
    if (!correlationData.length) return null;

    // Filter by task type if specified
    let selectedMatrix = correlationData[0];
    if (taskType) {
      const taskMatrix = correlationData.find(
        (matrix) => matrix.task_type === taskType,
      );
      if (taskMatrix) {
        selectedMatrix = taskMatrix;
      }
    }

    return selectedMatrix;
  }, [correlationData, taskType]);

  const plotData = useMemo(() => {
    if (!chartData || !chartData.correlation_matrix.length) return [];

    const matrix = chartData.correlation_matrix;
    const metrics = chartData.metrics;

    // Create text annotations for each cell
    const annotations: any[] = [];
    if (showValues) {
      matrix.forEach((row, i) => {
        row.forEach((value, j) => {
          annotations.push({
            x: j,
            y: i,
            text: value.toFixed(2),
            showarrow: false,
            font: {
              color: Math.abs(value) > 0.5 ? "white" : "black",
              size: 11,
              weight: "bold",
            },
          });
        });
      });
    }

    return [
      {
        z: matrix,
        x: metrics,
        y: metrics,
        type: "heatmap" as const,
        colorscale: [
          [0, "#d73027"], // Strong negative correlation - red
          [0.25, "#fc8d59"], // Moderate negative - orange
          [0.5, "#fee08b"], // Weak negative - light yellow
          [0.5, "#ffffff"], // No correlation - white
          [0.75, "#e0f3db"], // Weak positive - light green
          [1, "#31a354"], // Strong positive - green
        ],
        zmin: -1,
        zmax: 1,
        hoverongaps: false,
        hovertemplate:
          "<b>%{y} vs %{x}</b><br>" +
          "Correlation: %{z:.3f}<br>" +
          "<extra></extra>",
        showscale: true,
        colorbar: {
          title: {
            text: "Correlation<br>Coefficient",
            font: { size: 12 },
          },
          tickmode: "array",
          tickvals: [-1, -0.5, 0, 0.5, 1],
          ticktext: ["-1.0", "-0.5", "0.0", "0.5", "1.0"],
          len: 0.7,
          thickness: 15,
          x: 1.02,
        },
      },
    ];
  }, [chartData, showValues]);

  const layout = useMemo(() => {
    if (!chartData) return {};

    return {
      title: {
        text: taskType
          ? `${title} - ${getTaskDisplayName(taskType)}`
          : `${title} - ${getTaskDisplayName(chartData.task_type)}`,
        font: { size: 16, color: "#374151" },
      },
      xaxis: {
        title: "Metrics",
        side: "bottom" as const,
        tickangle: -45,
        tickfont: { size: 10 },
        showgrid: false,
        zeroline: false,
        automargin: true,
      },
      yaxis: {
        title: "Metrics",
        tickfont: { size: 10 },
        showgrid: false,
        zeroline: false,
        autorange: "reversed" as const,
        automargin: true,
      },
      plot_bgcolor: "rgba(0,0,0,0)",
      paper_bgcolor: "rgba(0,0,0,0)",
      margin: {
        l: 100,
        r: 80,
        t: 80,
        b: 120,
      },
      height: Math.max(400, chartData.metrics.length * 40 + 200),
      width: Math.max(1200, chartData.metrics.length * 40 + 200),
      annotations: showValues
        ? plotData[0]?.z
            ?.map((row: number[], i: number) =>
              row.map((value: number, j: number) => ({
                x: j,
                y: i,
                text: value.toFixed(2),
                showarrow: false,
                font: {
                  color: Math.abs(value) > 0.6 ? "white" : "black",
                  size: 11,
                  weight: "bold",
                },
              })),
            )
            .flat()
        : [],
    };
  }, [chartData, taskType, title, showValues, plotData]);

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: [
      "pan2d",
      "lasso2d",
      "select2d",
      "autoScale2d",
      "hoverClosestCartesian",
      "hoverCompareCartesian",
      "zoom2d",
    ],
    toImageButtonOptions: {
      format: "png" as const,
      filename: `correlation-heatmap-${taskType || "all-tasks"}`,
      height: 800,
      width: 1200,
      scale: 2,
    },
  };

  const interpretationText = useMemo(() => {
    if (!chartData || !chartData.correlation_matrix.length) return null;

    const matrix = chartData.correlation_matrix;
    const metrics = chartData.metrics;

    // Find strongest correlations (excluding diagonal)
    const correlations: Array<{
      metric1: string;
      metric2: string;
      value: number;
    }> = [];

    matrix.forEach((row, i) => {
      row.forEach((value, j) => {
        if (i < j && Math.abs(value) > 0.3) {
          // Only show correlations > 0.3
          correlations.push({
            metric1: metrics[i],
            metric2: metrics[j],
            value,
          });
        }
      });
    });

    correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return correlations.slice(0, 3); // Top 3 correlations
  }, [chartData]);

  if (!chartData || !chartData.correlation_matrix.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Correlation matrix between different performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No correlation data available for the selected criteria
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Correlation matrix for {chartData.metrics.length} metrics (
          {getTaskDisplayName(chartData.task_type)})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full space-y-4">
          <Plot
            data={plotData}
            layout={layout}
            config={config}
            className="w-full"
            useResizeHandler={true}
            style={{ width: 1200, height: "100%" }}
          />

          {interpretationText && interpretationText.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Key Correlations
              </h4>
              <div className="space-y-2 text-sm">
                {interpretationText.map((corr, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-blue-700 dark:text-blue-300">
                      {corr.metric1} ↔ {corr.metric2}
                    </span>
                    <span
                      className={`font-mono font-semibold px-2 py-1 rounded text-xs ${
                        corr.value > 0.7
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : corr.value > 0.3
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : corr.value < -0.7
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                      }`}
                    >
                      {corr.value > 0 ? "+" : ""}
                      {corr.value.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  <strong>+0.7 to +1.0:</strong> Strong positive correlation
                  {" · "}
                  <strong>-0.7 to -1.0:</strong> Strong negative correlation
                  {" · "}
                  <strong>±0.3 to ±0.7:</strong> Moderate correlation
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color Scale
              </h5>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Strong Positive (+0.7 to +1.0)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-300 rounded"></div>
                  <span>Weak Positive (0 to +0.7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Strong Negative (-1.0 to -0.7)</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interpretation
              </h5>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Values close to +1 indicate metrics that improve together.
                Values close to -1 indicate inverse relationships. Values near 0
                show little to no correlation.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
