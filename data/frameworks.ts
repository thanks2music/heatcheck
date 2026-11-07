// The frameworks heatcheck tracks. Each entry is measured by the stars its
// GitHub repositories gain over time.
//
// Rules for adding an entry:
// - Development happens on GitHub, or the project publishes an official GitHub
//   mirror (set `mirror: true`; stars on a mirror tend to undercount).
// - The repository is not archived. Use the canonical owner/name that
//   `gh api repos/{owner}/{repo} --jq .full_name` returns.
// - List several repositories when one framework moved between them (Vue 2
//   and Vue 3) or is split across them (Laravel's skeleton and framework).
//   Their stars are added together, so someone who starred both counts twice.

import { z } from "zod";
import { categories } from "./categories";

export { type Category, categories, categoryLabels } from "./categories";

const repoName = z.string().regex(/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/, "expected owner/name");

export const frameworkSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected kebab-case"),
  name: z.string().min(1),
  category: z.enum(categories),
  repos: z.array(repoName).min(1),
  mirror: z.boolean().optional(),
  note: z.string().min(1).optional(),
});

export type Framework = z.infer<typeof frameworkSchema>;

export const frameworkListSchema = z.array(frameworkSchema).superRefine((list, ctx) => {
  const ids = new Set<string>();
  const repos = new Set<string>();
  for (const [index, framework] of list.entries()) {
    if (ids.has(framework.id)) {
      ctx.addIssue({ code: "custom", path: [index, "id"], message: `duplicate id ${framework.id}` });
    }
    ids.add(framework.id);
    for (const repo of framework.repos) {
      const key = repo.toLowerCase();
      if (repos.has(key)) {
        ctx.addIssue({ code: "custom", path: [index, "repos"], message: `duplicate repo ${repo}` });
      }
      repos.add(key);
    }
  }
});

const list: Framework[] = [
  // Frontend
  { id: "react", name: "React", category: "frontend", repos: ["react/react"] },
  { id: "vue", name: "Vue", category: "frontend", repos: ["vuejs/core", "vuejs/vue"] },
  { id: "angular", name: "Angular", category: "frontend", repos: ["angular/angular"] },
  { id: "svelte", name: "Svelte", category: "frontend", repos: ["sveltejs/svelte"] },
  { id: "solid", name: "Solid", category: "frontend", repos: ["solidjs/solid"] },
  { id: "preact", name: "Preact", category: "frontend", repos: ["preactjs/preact"] },
  { id: "qwik", name: "Qwik", category: "frontend", repos: ["QwikDev/qwik"] },
  { id: "lit", name: "Lit", category: "frontend", repos: ["lit/lit"] },
  { id: "alpinejs", name: "Alpine.js", category: "frontend", repos: ["alpinejs/alpine"] },
  { id: "htmx", name: "htmx", category: "frontend", repos: ["bigskysoftware/htmx"] },
  { id: "ember", name: "Ember.js", category: "frontend", repos: ["emberjs/ember.js"] },
  { id: "jquery", name: "jQuery", category: "frontend", repos: ["jquery/jquery"] },
  { id: "nextjs", name: "Next.js", category: "frontend", repos: ["vercel/next.js"] },
  { id: "nuxt", name: "Nuxt", category: "frontend", repos: ["nuxt/nuxt"] },
  { id: "astro", name: "Astro", category: "frontend", repos: ["withastro/astro"] },
  { id: "sveltekit", name: "SvelteKit", category: "frontend", repos: ["sveltejs/kit"] },
  { id: "solidstart", name: "SolidStart", category: "frontend", repos: ["solidjs/solid-start"] },
  { id: "remix", name: "Remix", category: "frontend", repos: ["remix-run/remix"] },
  { id: "react-router", name: "React Router", category: "frontend", repos: ["remix-run/react-router"] },
  { id: "gatsby", name: "Gatsby", category: "frontend", repos: ["gatsbyjs/gatsby"] },
  { id: "fresh", name: "Fresh", category: "frontend", repos: ["freshframework/fresh"] },
  { id: "hugo", name: "Hugo", category: "frontend", repos: ["gohugoio/hugo"] },
  {
    id: "eleventy",
    name: "Eleventy",
    category: "frontend",
    repos: ["11ty/buildawesome"],
    note: "Renamed Build Awesome",
  },
  { id: "tailwindcss", name: "Tailwind CSS", category: "frontend", repos: ["tailwindlabs/tailwindcss"] },
  { id: "bootstrap", name: "Bootstrap", category: "frontend", repos: ["twbs/bootstrap"] },

  // Backend
  { id: "express", name: "Express", category: "backend", repos: ["expressjs/express"] },
  { id: "fastify", name: "Fastify", category: "backend", repos: ["fastify/fastify"] },
  { id: "nestjs", name: "NestJS", category: "backend", repos: ["nestjs/nest"] },
  { id: "hono", name: "Hono", category: "backend", repos: ["honojs/hono"] },
  { id: "koa", name: "Koa", category: "backend", repos: ["koajs/koa"] },
  { id: "adonisjs", name: "AdonisJS", category: "backend", repos: ["adonisjs/core"] },
  { id: "elysia", name: "Elysia", category: "backend", repos: ["elysiajs/elysia"] },
  { id: "django", name: "Django", category: "backend", repos: ["django/django"] },
  { id: "fastapi", name: "FastAPI", category: "backend", repos: ["fastapi/fastapi"] },
  { id: "flask", name: "Flask", category: "backend", repos: ["pallets/flask"] },
  { id: "laravel", name: "Laravel", category: "backend", repos: ["laravel/laravel", "laravel/framework"] },
  { id: "symfony", name: "Symfony", category: "backend", repos: ["symfony/symfony"] },
  { id: "rails", name: "Ruby on Rails", category: "backend", repos: ["rails/rails"] },
  { id: "spring-boot", name: "Spring Boot", category: "backend", repos: ["spring-projects/spring-boot"] },
  { id: "quarkus", name: "Quarkus", category: "backend", repos: ["quarkusio/quarkus"] },
  { id: "micronaut", name: "Micronaut", category: "backend", repos: ["micronaut-projects/micronaut-core"] },
  { id: "ktor", name: "Ktor", category: "backend", repos: ["ktorio/ktor"] },
  { id: "aspnet-core", name: "ASP.NET Core", category: "backend", repos: ["dotnet/aspnetcore"] },
  { id: "gin", name: "Gin", category: "backend", repos: ["gin-gonic/gin"] },
  { id: "echo", name: "Echo", category: "backend", repos: ["labstack/echo"] },
  { id: "fiber", name: "Fiber", category: "backend", repos: ["gofiber/fiber"] },
  { id: "axum", name: "Axum", category: "backend", repos: ["tokio-rs/axum"] },
  { id: "actix-web", name: "Actix Web", category: "backend", repos: ["actix/actix-web"] },
  { id: "phoenix", name: "Phoenix", category: "backend", repos: ["phoenixframework/phoenix"] },
  { id: "vapor", name: "Vapor", category: "backend", repos: ["vapor/vapor"] },
  {
    id: "wordpress",
    name: "WordPress",
    category: "backend",
    repos: ["WordPress/WordPress"],
    mirror: true,
    note: "CMS developed in Subversion",
  },

  // Mobile & Desktop
  { id: "flutter", name: "Flutter", category: "mobile-desktop", repos: ["flutter/flutter"] },
  { id: "react-native", name: "React Native", category: "mobile-desktop", repos: ["react/react-native"] },
  { id: "expo", name: "Expo", category: "mobile-desktop", repos: ["expo/expo"] },
  { id: "ionic", name: "Ionic", category: "mobile-desktop", repos: ["ionic-team/ionic-framework"] },
  { id: "capacitor", name: "Capacitor", category: "mobile-desktop", repos: ["ionic-team/capacitor"] },
  {
    id: "nativescript",
    name: "NativeScript",
    category: "mobile-desktop",
    repos: ["NativeScript/NativeScript"],
  },
  { id: "dotnet-maui", name: ".NET MAUI", category: "mobile-desktop", repos: ["dotnet/maui"] },
  {
    id: "compose-multiplatform",
    name: "Compose Multiplatform",
    category: "mobile-desktop",
    repos: ["JetBrains/compose-multiplatform"],
  },
  { id: "lynx", name: "Lynx", category: "mobile-desktop", repos: ["lynx-family/lynx"] },
  { id: "valdi", name: "Valdi", category: "mobile-desktop", repos: ["Snapchat/Valdi"] },
  { id: "electron", name: "Electron", category: "mobile-desktop", repos: ["electron/electron"] },
  { id: "tauri", name: "Tauri", category: "mobile-desktop", repos: ["tauri-apps/tauri"] },
  { id: "wails", name: "Wails", category: "mobile-desktop", repos: ["wailsapp/wails"] },
  {
    id: "neutralinojs",
    name: "Neutralinojs",
    category: "mobile-desktop",
    repos: ["neutralinojs/neutralinojs"],
  },
  { id: "nwjs", name: "NW.js", category: "mobile-desktop", repos: ["nwjs/nw.js"] },
  { id: "avalonia", name: "Avalonia", category: "mobile-desktop", repos: ["AvaloniaUI/Avalonia"] },
  { id: "uno-platform", name: "Uno Platform", category: "mobile-desktop", repos: ["unoplatform/uno"] },
  {
    id: "qt",
    name: "Qt",
    category: "mobile-desktop",
    repos: ["qt/qtbase"],
    mirror: true,
    note: "Developed on qt-project.org",
  },
  { id: "fyne", name: "Fyne", category: "mobile-desktop", repos: ["fyne-io/fyne"] },
  { id: "slint", name: "Slint", category: "mobile-desktop", repos: ["slint-ui/slint"] },
  { id: "egui", name: "egui", category: "mobile-desktop", repos: ["emilk/egui"] },
  { id: "iced", name: "Iced", category: "mobile-desktop", repos: ["iced-rs/iced"] },
  { id: "dioxus", name: "Dioxus", category: "mobile-desktop", repos: ["DioxusLabs/dioxus"] },
  { id: "flet", name: "Flet", category: "mobile-desktop", repos: ["flet-dev/flet"] },
  { id: "kivy", name: "Kivy", category: "mobile-desktop", repos: ["kivy/kivy"] },

  // AI & ML
  { id: "pytorch", name: "PyTorch", category: "ai-ml", repos: ["pytorch/pytorch"] },
  { id: "tensorflow", name: "TensorFlow", category: "ai-ml", repos: ["tensorflow/tensorflow"] },
  { id: "jax", name: "JAX", category: "ai-ml", repos: ["jax-ml/jax"] },
  { id: "keras", name: "Keras", category: "ai-ml", repos: ["keras-team/keras"] },
  { id: "scikit-learn", name: "scikit-learn", category: "ai-ml", repos: ["scikit-learn/scikit-learn"] },
  { id: "transformers", name: "Transformers", category: "ai-ml", repos: ["huggingface/transformers"] },
  {
    id: "pytorch-lightning",
    name: "PyTorch Lightning",
    category: "ai-ml",
    repos: ["Lightning-AI/pytorch-lightning"],
  },
  { id: "xgboost", name: "XGBoost", category: "ai-ml", repos: ["dmlc/xgboost"] },
  { id: "lightgbm", name: "LightGBM", category: "ai-ml", repos: ["lightgbm-org/LightGBM"] },
  { id: "spacy", name: "spaCy", category: "ai-ml", repos: ["explosion/spaCy"] },
  { id: "mlx", name: "MLX", category: "ai-ml", repos: ["ml-explore/mlx"] },
  { id: "vllm", name: "vLLM", category: "ai-ml", repos: ["vllm-project/vllm"] },
  { id: "sglang", name: "SGLang", category: "ai-ml", repos: ["sgl-project/sglang"] },
  { id: "langchain", name: "LangChain", category: "ai-ml", repos: ["langchain-ai/langchain"] },
  { id: "langgraph", name: "LangGraph", category: "ai-ml", repos: ["langchain-ai/langgraph"] },
  { id: "llamaindex", name: "LlamaIndex", category: "ai-ml", repos: ["run-llama/llama_index"] },
  { id: "dspy", name: "DSPy", category: "ai-ml", repos: ["stanfordnlp/dspy"] },
  { id: "haystack", name: "Haystack", category: "ai-ml", repos: ["deepset-ai/haystack"] },
  { id: "autogen", name: "AutoGen", category: "ai-ml", repos: ["microsoft/autogen"] },
  { id: "crewai", name: "CrewAI", category: "ai-ml", repos: ["crewAIInc/crewAI"] },
  { id: "semantic-kernel", name: "Semantic Kernel", category: "ai-ml", repos: ["microsoft/semantic-kernel"] },
  { id: "vercel-ai-sdk", name: "AI SDK", category: "ai-ml", repos: ["vercel/ai"] },
  { id: "mastra", name: "Mastra", category: "ai-ml", repos: ["mastra-ai/mastra"] },
  {
    id: "openai-agents-sdk",
    name: "OpenAI Agents SDK",
    category: "ai-ml",
    repos: ["openai/openai-agents-python"],
  },
  { id: "pydantic-ai", name: "Pydantic AI", category: "ai-ml", repos: ["pydantic/pydantic-ai"] },
];

export const frameworks: Framework[] = frameworkListSchema.parse(list);
