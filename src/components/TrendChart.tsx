import {
  CategoryScale,
  Chart,
  type ChartDataset,
  type ChartOptions,
  LinearScale,
  LineController,
  LineElement,
  LogarithmicScale,
  type Plugin,
  PointElement,
  Tooltip,
} from "chart.js";
import { useEffect, useRef } from "preact/hooks";
import { formatMonth, formatShare } from "../format";
import type { LineStyle } from "../lib/colors";
import type { Scale } from "../lib/url-state";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  Tooltip,
);

export interface ChartLine {
  id: string;
  name: string;
  share: number[];
  stars: number[];
  style: LineStyle;
}

interface Props {
  months: string[];
  lines: ChartLine[];
  scale: Scale;
  highlighted: string | null;
}

const textColor = "#c3c2b7";
const gridColor = "rgba(240, 239, 236, 0.08)";
const dimAlpha = "59"; // about 35% opacity, appended to a hex color

/** A vertical rule at the hovered month, so the tooltip reads as a crosshair. */
const hoverRule: Plugin<"line"> = {
  id: "hoverRule",
  afterDatasetsDraw(chart) {
    const active = chart.tooltip?.getActiveElements()[0];
    if (!active) return;
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.strokeStyle = "rgba(240, 239, 236, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(active.element.x, chartArea.top);
    ctx.lineTo(active.element.x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

function yScale(scale: Scale): NonNullable<ChartOptions<"line">["scales"]>["y"] {
  return {
    type: scale === "log" ? "logarithmic" : "linear",
    ...(scale === "linear" ? { beginAtZero: true } : {}),
    grid: { color: gridColor },
    border: { display: false },
    ticks: {
      color: textColor,
      callback: (value) => {
        const number = Number(value);
        // On a log axis, label only 1, 2 and 5 of each power of ten.
        if (scale === "log") {
          const mantissa = Number((number / 10 ** Math.floor(Math.log10(number))).toPrecision(6));
          if (![1, 2, 5].includes(mantissa)) return "";
        }
        return `${Number(number.toPrecision(3))}%`;
      },
    },
  };
}

/** Label every year on a wide chart, and every second or third year on a narrow one. */
function yearStep(width: number): number {
  return width < 480 ? 3 : width < 760 ? 2 : 1;
}

function toDataset(line: ChartLine, scale: Scale, highlighted: string | null): ChartDataset<"line"> {
  const dimmed = highlighted !== null && highlighted !== line.id;
  const color = dimmed ? `${line.style.color}${dimAlpha}` : line.style.color;
  return {
    label: line.name,
    // A log axis cannot place zero; leave a gap until the framework has stars.
    data: scale === "log" ? line.share.map((value) => (value > 0 ? value : null)) : line.share,
    borderColor: color,
    backgroundColor: color,
    borderWidth: highlighted === line.id ? 4 : 2,
    borderDash: line.style.dashed ? [6, 4] : [],
    pointRadius: 0,
    pointHoverRadius: 4,
    pointHitRadius: 6,
    cubicInterpolationMode: "monotone",
  };
}

export function TrendChart({ months, lines, scale, highlighted }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart<"line"> | null>(null);
  // The tooltip callbacks read the current lines, not the ones from the first render.
  const currentLines = useRef(lines);
  currentLines.current = lines;

  useEffect(() => {
    if (!canvas.current) return;
    chart.current = new Chart(canvas.current, {
      type: "line",
      data: { labels: months, datasets: [] },
      plugins: [hoverRule],
      options: {
        maintainAspectRatio: false,
        animation: { duration: 250 },
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            grid: { display: false },
            border: { color: gridColor },
            ticks: {
              color: textColor,
              autoSkip: false,
              maxRotation: 0,
              callback(_value, index) {
                const month = months[index] ?? "";
                if (!month.endsWith("-01")) return "";
                const year = Number(month.slice(0, 4));
                const firstYear = Number(months[0]?.slice(0, 4));
                return (year - firstYear) % yearStep(this.width) === 0 ? String(year) : "";
              },
            },
          },
          y: yScale("linear"),
        },
        plugins: {
          tooltip: {
            itemSort: (a, b) => (b.parsed.y ?? 0) - (a.parsed.y ?? 0),
            callbacks: {
              title: (items) => formatMonth(months[items[0]?.dataIndex ?? 0] ?? ""),
              label: (item) => {
                const line = currentLines.current[item.datasetIndex];
                if (!line) return "";
                const stars = line.stars[item.dataIndex] ?? 0;
                return ` ${line.name}: ${formatShare(item.parsed.y ?? 0)} (${stars.toLocaleString("en-US")} stars/mo)`;
              },
            },
          },
        },
      },
    });
    return () => {
      chart.current?.destroy();
      chart.current = null;
    };
  }, [months]);

  useEffect(() => {
    const instance = chart.current;
    if (!instance) return;
    instance.data.datasets = lines.map((line) => toDataset(line, scale, highlighted));
    if (instance.options.scales) instance.options.scales.y = yScale(scale);
    instance.update();
  }, [lines, scale, highlighted]);

  const names = lines.map((line) => line.name).join(", ");
  return (
    <div class="chart">
      <canvas
        ref={canvas}
        role="img"
        aria-label={`Line chart of each framework's share of new GitHub stars by month: ${names || "nothing selected"}`}
      />
    </div>
  );
}
