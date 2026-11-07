import { useState } from "preact/hooks";
import { type Category, categories, categoryLabels } from "../../data/categories";
import { formatShare } from "../format";
import { slotStyle } from "../lib/colors";
import { maxSelected, type Slots } from "../lib/selection";
import type { FrameworkSeries } from "../lib/types";
import { type CategoryFilter, inCategory, type Scale, scales } from "../lib/url-state";

interface Props {
  frameworks: FrameworkSeries[];
  slots: Slots;
  category: CategoryFilter;
  scale: Scale;
  notice: string | null;
  onToggle: (id: string) => void;
  onHighlight: (id: string | null) => void;
  onCategory: (category: CategoryFilter) => void;
  onReset: () => void;
  onEmpty: () => void;
  onScale: (scale: Scale) => void;
}

const filters: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...categories.map((value: Category) => ({ value, label: categoryLabels[value] })),
];

function ChoiceGroup<Value extends string>(props: {
  name: string;
  legend: string;
  options: { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  class: string;
}) {
  return (
    <fieldset class={props.class}>
      <legend class="visually-hidden">{props.legend}</legend>
      {props.options.map((option) => (
        <label key={option.value} class="chip">
          <input
            type="radio"
            name={props.name}
            value={option.value}
            checked={props.value === option.value}
            onChange={() => props.onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

const scaleLabels: Record<Scale, string> = { linear: "Linear", log: "Log" };
const scaleOptions = scales.map((value) => ({ value, label: scaleLabels[value] }));

function RankChange({ change }: { change: number | null }) {
  if (change === null) return <span class="change new">new</span>;
  if (change === 0) return <span class="change">–</span>;
  return (
    <span class={`change ${change > 0 ? "up" : "down"}`}>{change > 0 ? `▲${change}` : `▼${-change}`}</span>
  );
}

export function FrameworkList(props: Props) {
  const { frameworks, slots, category, scale, notice } = props;
  const [search, setSearch] = useState("");
  const [trimmed, setTrimmed] = useState(false);
  const query = search.trim().toLowerCase();
  const visible = frameworks.filter(
    (framework) =>
      inCategory(framework, category) &&
      (!trimmed || slots.includes(framework.id)) &&
      framework.name.toLowerCase().includes(query),
  );

  return (
    <aside class="sidebar">
      <ChoiceGroup
        class="filters"
        name="category"
        legend="Category"
        options={filters}
        value={category}
        onChange={props.onCategory}
      />
      <input
        class="search"
        type="search"
        placeholder="Filter by name"
        aria-label="Filter frameworks by name"
        value={search}
        onInput={(event) => {
          setSearch(event.currentTarget.value);
          setTrimmed(false);
        }}
      />
      <div class="tools">
        <button
          type="button"
          class="button"
          onClick={() => {
            setSearch("");
            props.onReset();
          }}
          title={`Select the top ${maxSelected} in this category`}
        >
          Reset
        </button>
        <button type="button" class="button" onClick={props.onEmpty} title="Clear the selection">
          Empty
        </button>
        <button
          type="button"
          class="button"
          aria-pressed={trimmed}
          onClick={() => setTrimmed((value) => !value)}
          title="Show only selected frameworks"
        >
          Trim
        </button>
        <ChoiceGroup
          class="segmented"
          name="scale"
          legend="Y axis scale"
          options={scaleOptions}
          value={scale}
          onChange={props.onScale}
        />
      </div>
      <p class="notice" role="status" aria-live="polite">
        {notice}
      </p>
      <ol class="list">
        {visible.map((framework) => {
          const slot = slots.indexOf(framework.id);
          const style = slot === -1 ? null : slotStyle(slot);
          const share = framework.share.at(-1) ?? 0;
          const details = [
            framework.mirror
              ? "Official GitHub mirror: development happens elsewhere, so stars may undercount."
              : "",
            framework.note ?? "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <li key={framework.id} class="row">
              <button
                type="button"
                class="pick"
                aria-pressed={style !== null}
                onClick={() => props.onToggle(framework.id)}
                onMouseEnter={() => style && props.onHighlight(framework.id)}
                onMouseLeave={() => props.onHighlight(null)}
                onFocus={() => style && props.onHighlight(framework.id)}
                onBlur={() => props.onHighlight(null)}
              >
                <span class="rank">{framework.rank}</span>
                <span
                  class={`swatch${style?.dashed ? " dashed" : ""}`}
                  style={style ? { "--swatch": style.color } : undefined}
                  aria-hidden="true"
                />
                <span class="name" title={details || undefined}>
                  {framework.name}
                  {framework.mirror && <span class="mirror"> M</span>}
                </span>
                <span class="share">{formatShare(share)}</span>
                <RankChange change={framework.rankChange} />
              </button>
              <a
                class="repo-link"
                href={`https://github.com/${framework.repo}`}
                aria-label={`${framework.name} on GitHub`}
                title={framework.repo}
              >
                ↗
              </a>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
