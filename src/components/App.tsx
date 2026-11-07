import { useEffect, useMemo, useState } from "preact/hooks";
import { seriesData } from "../data";
import { slotStyle } from "../lib/colors";
import { maxSelected, type Slots, selectedIds, slotsFromIds, toggleSlot } from "../lib/selection";
import { type CategoryFilter, parseUrlState, type Scale, serializeUrlState } from "../lib/url-state";
import { FrameworkList } from "./FrameworkList";
import { Header } from "./Header";
import { type ChartLine, TrendChart } from "./TrendChart";

const { months, frameworks } = seriesData;
const byId = new Map(frameworks.map((framework) => [framework.id, framework]));
const lastMonth = months.at(-1) ?? "";

function topIds(category: CategoryFilter): string[] {
  return frameworks
    .filter((framework) => category === "all" || framework.category === category)
    .slice(0, maxSelected)
    .map((framework) => framework.id);
}

const defaultIds = topIds("all");
const initial = parseUrlState(window.location.search, new Set(byId.keys()));

export function App() {
  const [slots, setSlots] = useState<Slots>(() => slotsFromIds(initial.selected ?? defaultIds));
  const [scale, setScale] = useState<Scale>(initial.scale ?? "linear");
  const [category, setCategory] = useState<CategoryFilter>(initial.category ?? "all");
  const [search, setSearch] = useState("");
  const [trimmed, setTrimmed] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Keep the address bar a permalink of the current view.
  useEffect(() => {
    const query = serializeUrlState({ selected: selectedIds(slots), scale, category }, defaultIds);
    window.history.replaceState(null, "", `${window.location.pathname}${query}${window.location.hash}`);
  }, [slots, scale, category]);

  const lines = useMemo<ChartLine[]>(
    () =>
      slots.flatMap((id, slot) => {
        const framework = id ? byId.get(id) : undefined;
        return framework ? [{ ...framework, style: slotStyle(slot) }] : [];
      }),
    [slots],
  );

  const toggle = (id: string) => {
    const result = toggleSlot(slots, id);
    setNotice(result.full ? `Up to ${maxSelected} frameworks at a time. Deselect one first.` : null);
    setSlots(result.slots);
  };

  return (
    <div class="layout">
      <Header lastMonth={lastMonth} frameworkCount={frameworks.length} />
      <main class="main">
        <section class="chart-panel" aria-label="Chart">
          <TrendChart months={months} lines={lines} scale={scale} highlighted={highlighted} />
          <p class="chart-note">
            Stars show attention on GitHub, not how many people use a framework. A single month of burst
            starring is ignored by the 3-month median. <abbr title="Official GitHub mirror">M</abbr> marks
            mirrors of projects developed elsewhere.
          </p>
        </section>
        <FrameworkList
          frameworks={frameworks}
          slots={slots}
          category={category}
          search={search}
          trimmed={trimmed}
          scale={scale}
          notice={notice}
          onToggle={toggle}
          onHighlight={setHighlighted}
          onCategory={setCategory}
          onSearch={(value) => {
            setSearch(value);
            setTrimmed(false);
          }}
          onReset={() => {
            setSlots(slotsFromIds(topIds(category)));
            setSearch("");
            setNotice(null);
          }}
          onEmpty={() => {
            setSlots(slotsFromIds([]));
            setNotice(null);
          }}
          onTrim={() => setTrimmed((value) => !value)}
          onScale={setScale}
        />
      </main>
    </div>
  );
}
