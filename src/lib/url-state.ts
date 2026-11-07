// The page state lives in the query string, so the address bar is always a
// permalink: ?f=react,vue&scale=log&cat=backend

import { type Category, categories } from "../../data/categories";
import { maxSelected } from "./selection";

export type Scale = "linear" | "log";
export type CategoryFilter = Category | "all";

export interface UrlState {
  /** Selected framework ids in slot order. */
  selected: string[];
  scale: Scale;
  category: CategoryFilter;
}

/** Reads what the query string holds; ids not in `knownIds` and bad values are dropped. */
export function parseUrlState(search: string, knownIds: ReadonlySet<string>): Partial<UrlState> {
  const params = new URLSearchParams(search);
  const state: Partial<UrlState> = {};
  const ids = params.get("f");
  if (ids !== null) {
    const valid = ids.split(",").filter((id) => knownIds.has(id));
    state.selected = [...new Set(valid)].slice(0, maxSelected);
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
export function serializeUrlState(state: UrlState, defaultSelected: readonly string[]): string {
  const params = new URLSearchParams();
  if (state.selected.join(",") !== defaultSelected.join(",")) params.set("f", state.selected.join(","));
  if (state.scale !== "linear") params.set("scale", state.scale);
  if (state.category !== "all") params.set("cat", state.category);
  const query = params.toString().replaceAll("%2C", ",");
  return query ? `?${query}` : "";
}
