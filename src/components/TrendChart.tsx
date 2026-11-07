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
import type { Ref } from "preact";
import { useEffect, useImperativeHandle, useRef } from "preact/hooks";
import { formatMonth, formatShare } from "../format";
import type { LineStyle } from "../lib/colors";
import { monthIndex } from "../lib/series";
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

/** Lets the list emphasize a line on hover without re-rendering the page. */
export interface ChartHandle {
  highlight(id: string | null): void;
}

interface Props {
  months: string[];
  lines: ChartLine[];
  scale: Scale;
  handle: Ref<ChartHandle>;
}

const dimAlpha = "59"; // about 35% opacity, appended to a hex color

/** Chart colors come from the CSS custom properties in styles.css. */
interface Theme {
  text: string;
  grid: string;
  rule: string;
}
let theme: Theme | undefined;
function chartTheme(): Theme {
  if (!theme) {
    const css = getComputedStyle(document.documentElement);
    const value = (name: string) => css.getPropertyValue(name).trim();
    theme = { text: value("--text-secondary"), grid: value("--chart-grid"), rule: value("--chart-rule") };
  }
  return theme;
}

/** A vertical rule at the hovered month, so the tooltip reads as a crosshair. */
const hoverRule: Plugin<"line"> = {
  id: "hoverRule",
  afterDatasetsDraw(chart) {
    const active = chart.tooltip?.getActiveElements()[0];
    if (!active) return;
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.strokeStyle = chartTheme().rule;
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
    beginAtZero: scale === "linear",
    grid: { color: chartTheme().grid },
    border: { display: false },
    ticks: {
      color: chartTheme().text,
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

/**
 * Color and width are scriptable options that read the highlighted id, so a
 * hover only needs `update("none")` instead of rebuilding the datasets.
 */
function toDataset(
  line: ChartLine,
  scale: Scale,
  highlighted: { current: string | null },
): ChartDataset<"line"> {
  const color = () =>
    highlighted.current !== null && highlighted.current !== line.id
      ? `${line.style.color}${dimAlpha}`
      : line.style.color;
  return {
    label: line.name,
    // A log axis cannot place zero; leave a gap until the framework has stars.
    data: scale === "log" ? line.share.map((value) => (value > 0 ? value : null)) : line.share,
    borderColor: color,
    backgroundColor: color,
    borderWidth: () => (highlighted.current === line.id ? 4 : 2),
    borderDash: line.style.dashed ? [6, 4] : [],
    pointRadius: 0,
    pointHoverRadius: 4,
    pointHitRadius: 6,
    cubicInterpolationMode: "monotone",
  };
}

export function TrendChart({ months, lines, scale, handle }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart<"line"> | null>(null);
  // Callbacks read the current lines, not the ones from the render that created them.
  const currentLines = useRef(lines);
  currentLines.current = lines;
  // Only a drawn line can be highlighted; otherwise every line would be dimmed.
  const highlighted = useRef<string | null>(null);

  useImperativeHandle(handle, () => ({
    highlight(id) {
      const drawn = id !== null && currentLines.current.some((line) => line.id === id);
      highlighted.current = drawn ? id : null;
      chart.current?.update("none");
    },
  }));

  useEffect(() => {
    if (!canvas.current) return;
    const firstYear = Math.floor(monthIndex(months[0] ?? "0-01") / 12);
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
            border: { color: chartTheme().grid },
            ticks: {
              color: chartTheme().text,
              autoSkip: false,
              maxRotation: 0,
              callback(_value, index) {
                const month = months[index];
                if (month === undefined || monthIndex(month) % 12 !== 0) return "";
                const year = monthIndex(month) / 12;
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
    if (!lines.some((line) => line.id === highlighted.current)) highlighted.current = null;
    instance.data.datasets = lines.map((line) => toDataset(line, scale, highlighted));
    if (instance.options.scales) instance.options.scales.y = yScale(scale);
    instance.update();
  }, [lines, scale]);

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
