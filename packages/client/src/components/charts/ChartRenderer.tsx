/**
 * ChartRenderer — renders the appropriate Chart.js component based on chart type.
 * Handles histogram binning, waterfall, candlestick, radar, stacking, and trendlines.
 */
import { useMemo, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Pie, Scatter, Radar, Doughnut } from "react-chartjs-2";
import type { ChartConfig, ChartType } from "../../types/grid";
import type { ChartDataset } from "../../utils/chartData";
import {
  computeHistogramBins,
  computeWaterfallData,
  extractCandlestickData,
  extractBubbleData,
  buildGaugeData,
  computeLinearTrendline,
  computeExponentialTrendline,
  computePolynomialTrendline,
} from "../../utils/chartHelpers";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface ChartRendererProps {
  chart: ChartConfig;
  chartData: ChartDataset;
}

const NO_SCALE_TYPES: ChartType[] = ["pie", "radar", "gauge"];

function buildBaseOptions(chart: ChartConfig) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: !!chart.title, text: chart.title ?? "" },
      subtitle: { display: !!chart.subtitle, text: chart.subtitle ?? "" },
      legend: {
        display: chart.showLegend !== false,
        position: (chart.legendPosition ?? "bottom") as
          | "top"
          | "bottom"
          | "left"
          | "right",
      },
    },
    scales: NO_SCALE_TYPES.includes(chart.type)
      ? undefined
      : {
          x: {
            title: {
              display: !!chart.xAxisLabel,
              text: chart.xAxisLabel ?? "",
            },
            stacked:
              chart.stackMode === "stacked" || chart.stackMode === "percent",
          },
          y: {
            title: {
              display: !!chart.yAxisLabel,
              text: chart.yAxisLabel ?? "",
            },
            stacked:
              chart.stackMode === "stacked" || chart.stackMode === "percent",
            ...(chart.stackMode === "percent"
              ? {
                  max: 100,
                  ticks: { callback: (v: number | string) => `${v}%` },
                }
              : {}),
          },
        },
  };
}

function addTrendlineDatasets(
  datasets: ChartDataset["datasets"],
  trendlineType: string,
): ChartDataset["datasets"] {
  const trendDatasets: ChartDataset["datasets"] = [];

  for (const ds of datasets) {
    let trend;
    switch (trendlineType) {
      case "linear":
        trend = computeLinearTrendline(ds.data, ds.label);
        break;
      case "exponential":
        trend = computeExponentialTrendline(ds.data, ds.label);
        break;
      case "polynomial":
        trend = computePolynomialTrendline(ds.data, ds.label);
        break;
      default:
        continue;
    }
    trendDatasets.push({
      label: trend.label,
      data: trend.data,
      borderColor: ds.borderColor,
      backgroundColor: [],
    });
  }

  return trendDatasets;
}

export function ChartRenderer({ chart, chartData }: ChartRendererProps) {
  const chartCanvasId = `chart-canvas-${chart.id}`;

  const options = useMemo(() => buildBaseOptions(chart), [chart]);

  const dataConfig = useMemo(() => {
    const colors = chart.colors?.length ? chart.colors : undefined;

    // Histogram: bin first dataset's values
    if (chart.type === "histogram") {
      const allValues = chartData.datasets.flatMap((ds) => ds.data);
      const bins = computeHistogramBins(allValues);
      return {
        labels: bins.map((b) => b.label),
        datasets: [
          {
            label: "Frequency",
            data: bins.map((b) => b.count),
            backgroundColor: colors?.[0] ?? "#4285f4",
            borderColor: "#1a73e8",
            borderWidth: 1,
          },
        ],
      };
    }

    // Waterfall: transform into floating bars
    if (chart.type === "waterfall") {
      const ds = chartData.datasets[0];
      if (!ds) return { labels: [], datasets: [] };
      const waterfallData = computeWaterfallData(chartData.labels, ds.data);
      const bgColors = waterfallData.map((p) =>
        p.isTotal ? "#4285f4" : p.value >= 0 ? "#34a853" : "#ea4335",
      );
      const bases = waterfallData.map((p) =>
        p.isTotal ? 0 : p.runningTotal - p.value,
      );
      return {
        labels: waterfallData.map((p) => p.label),
        datasets: [
          {
            label: "Base",
            data: bases,
            backgroundColor: "transparent",
            borderColor: "transparent",
            borderWidth: 0,
          },
          {
            label: ds.label,
            data: waterfallData.map((p) =>
              p.isTotal ? p.value : Math.abs(p.value),
            ),
            backgroundColor: bgColors,
            borderColor: bgColors,
            borderWidth: 1,
          },
        ],
      };
    }

    // Candlestick: render as floating bars
    if (chart.type === "candlestick") {
      const candles = extractCandlestickData(
        chartData.labels,
        chartData.datasets,
      );
      if (candles.length === 0) return { labels: [], datasets: [] };
      return {
        labels: candles.map((c) => c.label),
        datasets: [
          {
            label: "Low-High",
            data: candles.map((c) => c.high - c.low),
            backgroundColor: candles.map((c) =>
              c.close >= c.open ? "#34a85340" : "#ea433540",
            ),
            borderColor: candles.map((c) =>
              c.close >= c.open ? "#34a853" : "#ea4335",
            ),
            borderWidth: 1,
            base: candles.map((c) => c.low),
          },
          {
            label: "Open-Close",
            data: candles.map((c) => Math.abs(c.close - c.open)),
            backgroundColor: candles.map((c) =>
              c.close >= c.open ? "#34a853" : "#ea4335",
            ),
            borderColor: candles.map((c) =>
              c.close >= c.open ? "#34a853" : "#ea4335",
            ),
            borderWidth: 2,
            base: candles.map((c) => Math.min(c.open, c.close)),
          },
        ],
      };
    }

    // Standard datasets — clone data arrays to avoid mutating source
    let datasets = chartData.datasets.map((ds, i) => {
      const bgColor = colors ? colors[i % colors.length] : ds.backgroundColor;
      const clonedData = [...ds.data];

      if (chart.type === "line" || chart.type === "scatter") {
        return {
          ...ds,
          data: clonedData,
          backgroundColor:
            typeof bgColor === "string" ? bgColor : ds.borderColor,
          borderColor: ds.borderColor,
          fill: false,
          tension: chart.smoothLine ? 0.4 : 0,
        };
      }
      if (chart.type === "area") {
        return {
          ...ds,
          data: clonedData,
          backgroundColor: ds.borderColor ? ds.borderColor + "40" : undefined,
          borderColor: ds.borderColor,
          fill: true,
          tension: chart.smoothLine ? 0.4 : 0,
        };
      }
      if (chart.type === "radar") {
        return {
          ...ds,
          data: clonedData,
          backgroundColor: ds.borderColor ? ds.borderColor + "30" : undefined,
          borderColor: ds.borderColor,
          fill: true,
          pointBackgroundColor: ds.borderColor,
        };
      }
      return {
        ...ds,
        data: clonedData,
        backgroundColor: bgColor ?? ds.backgroundColor,
      };
    });

    // Percent stacked: normalize to 100
    if (chart.stackMode === "percent" && datasets.length > 0) {
      const numPoints = datasets[0].data.length;
      for (let p = 0; p < numPoints; p++) {
        const total = datasets.reduce(
          (sum, ds) => sum + Math.abs(ds.data[p] ?? 0),
          0,
        );
        if (total > 0) {
          for (const ds of datasets) {
            ds.data[p] = ((ds.data[p] ?? 0) / total) * 100;
          }
        }
      }
    }

    // Trendlines
    if (chart.trendline && chart.trendline !== "none") {
      const trendDatasets = addTrendlineDatasets(
        chartData.datasets,
        chart.trendline,
      );
      const trendFormatted = trendDatasets.map((td) => ({
        ...td,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        type: "line" as const,
      }));
      datasets = [...datasets, ...(trendFormatted as typeof datasets)];
    }

    // Combo: alternate bar and line
    if (chart.type === "combo") {
      const comboDatasets = datasets.map((ds, i) => ({
        ...ds,
        type: (i % 2 === 0 ? "bar" : "line") as "bar" | "line",
      }));
      return {
        labels: chartData.labels,
        datasets: comboDatasets as typeof datasets,
      };
    }

    return { labels: chartData.labels, datasets };
  }, [
    chartData,
    chart.type,
    chart.colors,
    chart.stackMode,
    chart.trendline,
    chart.smoothLine,
    chart.title,
  ]);

  const bubbleData = useMemo(() => {
    if (chart.type !== "bubble") return null;
    const colors = chart.colors?.length ? chart.colors : undefined;
    const bubblePoints = extractBubbleData(chartData.datasets);
    return {
      labels: [] as string[],
      datasets: [
        {
          label: chartData.datasets[0]?.label ?? "Bubble",
          data: bubblePoints,
          backgroundColor: (colors?.[0] ?? "#4285f4") + "80",
          borderColor: colors?.[0] ?? "#4285f4",
          borderWidth: 1,
        },
      ],
    };
  }, [chart.type, chart.colors, chartData.datasets]);

  const gaugeData = useMemo(() => {
    if (chart.type !== "gauge") return null;
    const colors = chart.colors?.length ? chart.colors : undefined;
    const firstValue = chartData.datasets[0]?.data[0] ?? 0;
    const gauge = buildGaugeData(firstValue, 0, 100, colors);
    return {
      labels: [] as string[],
      datasets: [
        {
          label: chart.title ?? "Value",
          data: gauge.data,
          backgroundColor: gauge.backgroundColor,
          borderWidth: 0,
          circumference: 180,
          rotation: 270,
        },
      ],
    };
  }, [chart.type, chart.colors, chart.title, chartData.datasets]);

  const handleExport = useCallback(() => {
    const chartInstance = ChartJS.getChart(chartCanvasId);
    if (!chartInstance) return;
    const url = chartInstance.toBase64Image();
    const link = document.createElement("a");
    link.download = `${chart.title ?? "chart"}.png`;
    link.href = url;
    link.click();
  }, [chart.title, chartCanvasId]);

  const waterfallOptions = useMemo(() => {
    if (chart.type !== "waterfall") return options;
    return {
      ...options,
      scales: {
        ...((options.scales as Record<string, unknown>) ?? {}),
        x: {
          stacked: true,
          title: { display: !!chart.xAxisLabel, text: chart.xAxisLabel ?? "" },
        },
        y: {
          stacked: true,
          title: { display: !!chart.yAxisLabel, text: chart.yAxisLabel ?? "" },
        },
      },
    };
  }, [options, chart.type, chart.xAxisLabel, chart.yAxisLabel]);

  const candlestickOptions = useMemo(() => {
    if (chart.type !== "candlestick") return options;
    return {
      ...options,
      scales: {
        ...((options.scales as Record<string, unknown>) ?? {}),
        x: {
          stacked: true,
          title: { display: !!chart.xAxisLabel, text: chart.xAxisLabel ?? "" },
        },
        y: {
          stacked: false,
          title: { display: !!chart.yAxisLabel, text: chart.yAxisLabel ?? "" },
        },
      },
    };
  }, [options, chart.type, chart.xAxisLabel, chart.yAxisLabel]);

  const renderChart = () => {
    switch (chart.type) {
      case "column":
      case "histogram":
        return <Bar id={chartCanvasId} data={dataConfig} options={options} />;
      case "bar":
        return (
          <Bar
            id={chartCanvasId}
            data={dataConfig}
            options={{ ...options, indexAxis: "y" as const }}
          />
        );
      case "line":
        return <Line id={chartCanvasId} data={dataConfig} options={options} />;
      case "area":
        return <Line id={chartCanvasId} data={dataConfig} options={options} />;
      case "pie":
        return <Pie id={chartCanvasId} data={dataConfig} options={options} />;
      case "scatter":
        return (
          <Scatter id={chartCanvasId} data={dataConfig} options={options} />
        );
      case "combo":
        return <Bar id={chartCanvasId} data={dataConfig} options={options} />;
      case "radar": {
        const { scales: _scales, ...radarOptions } = options;
        return (
          <Radar id={chartCanvasId} data={dataConfig} options={radarOptions} />
        );
      }
      case "waterfall":
        return (
          <Bar
            id={chartCanvasId}
            data={dataConfig}
            options={waterfallOptions}
          />
        );
      case "candlestick":
        return (
          <Bar
            id={chartCanvasId}
            data={dataConfig}
            options={candlestickOptions}
          />
        );
      case "bubble":
        return bubbleData ? (
          <Scatter id={chartCanvasId} data={bubbleData} options={options} />
        ) : null;
      case "gauge":
        return gaugeData ? (
          <Doughnut
            id={chartCanvasId}
            data={gaugeData}
            options={{
              ...options,
              cutout: "70%",
              plugins: {
                ...options.plugins,
                tooltip: { enabled: false },
              },
              scales: undefined,
            }}
          />
        ) : null;
      default:
        return <Bar id={chartCanvasId} data={dataConfig} options={options} />;
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {renderChart()}
      <button
        data-testid={`chart-export-png-${chart.id}`}
        onClick={handleExport}
        type="button"
        className="absolute top-1 right-1 bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Export as PNG"
      >
        PNG
      </button>
    </div>
  );
}
