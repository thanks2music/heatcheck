// Kept apart from frameworks.ts so the site can import the categories without
// bundling Zod and the framework list.

export const categories = ["frontend", "backend", "mobile-desktop", "ai-ml"] as const;
export type Category = (typeof categories)[number];

export const categoryLabels: Record<Category, string> = {
  frontend: "Frontend",
  backend: "Backend",
  "mobile-desktop": "Mobile & Desktop",
  "ai-ml": "AI & ML",
};
