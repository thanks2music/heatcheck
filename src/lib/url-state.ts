// The page state lives in the query string, so the address bar is always a
// permalink: ?f=react,vue&scale=log&cat=backend. An empty entry in `f` keeps
// a free slot (?f=,vue), so every line keeps its color after a reload.

import { type Category, categories } from "../../data/categories";
import { maxSelected, type Slots, slotsFromIds } from "./selection";

export type Scale = "linear" | "log";
export type CategoryFilter = Category | "all";

export interface UrlState {
  slots: Slots;
  scale: Scale;
  category: CategoryFilter;
}

/** Reads what the query string holds; ids not in `knownIds` and bad values are dropped. */
export function parseUrlState(search: string, knownIds: ReadonlySet<string>): Partial<UrlState> {
  const params = new URLSearchParams(search);
  const state: Partial<UrlState> = {};
  const ids = params.get("f");
  if (ids !== null) {
    const known = ids
      .split(",")
      .slice(0, maxSelected)
      .map((id) => (knownIds.has(id) ? id : null));
    // "f=" is a deliberately empty chart, but a link whose ids are all unknown
    // (for example after a rename) falls back to the default selection.
    if (ids === "" || known.some((id) => id !== null)) state.slots = slotsFromIds(known);
  }
  const scale = params.get("scale");
  if (scale === "linear" || scale === "log") state.scale = scale;
  const category = params.get("cat");
  if (category === "all" || (categories as readonly string[]).includes(category ?? "")) {
    state.category = category as CategoryFilter;
  }
  return state;
}

/** Query string for a state, leaving out values that match the defaults. */
export function serializeUrlState(state: UrlState, defaultSlots: Slots): string {
  const params = new URLSearchParams();
  const ids = encodeSlots(state.slots);
  if (ids !== encodeSlots(defaultSlots)) params.set("f", ids);
  if (state.scale !== "linear") params.set("scale", state.scale);
  if (state.category !== "all") params.set("cat", state.category);
  const query = params.toString().replaceAll("%2C", ",");
  return query ? `?${query}` : "";
}

/** "react,,vue" for [react, null, vue, null, ...]; trailing free slots are dropped. */
function encodeSlots(slots: Slots): string {
  const ids = slots.map((id) => id ?? "");
  while (ids.at(-1) === "") ids.pop();
  return ids.join(",");
}
