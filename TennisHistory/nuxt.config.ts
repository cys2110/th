// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxt/eslint", "@nuxt/hints", "@nuxt/image", "@vueuse/nuxt", "nuxt-echarts", "nuxt-neo4j", "@nuxt/ui"],

  // Set page transitions
  app: { pageTransition: { name: "page", mode: "out-in" } },
  // Set scroll behaviour
  router: { options: { scrollBehaviorType: "smooth" } },
  // CSS path
  css: ["~/assets/css/main.css"],
  // Turn on typed router
  experimental: { typedPages: true },
  runtimeConfig: {
    public: {
      devMode: process.env.NODE_ENV === "development" || false
    }
  },
  // Imports not required
  imports: {
    presets: [
      {
        from: "@vueuse/core",
        imports: [
          "breakpointsTailwind",
          "useBreakpoints",
          "provideSSRWidth",
          "useSSRWidth",
          "createReusableTemplate",
          "useInfiniteScroll",
          "useDateFormat",
          "isDefined",
          "get",
          "set",
          "useSorted",
          "useArrayUnique",
          "useArrayFilter",
          "useArrayMap",
          "useArrayJoin",
          "useArrayFindLast",
          "useArraySome",
          "useArrayEvery",
          "watchDeep",
          "watchImmediate",
          "watchOnce"
        ]
      },
      {
        from: "@vueuse/router",
        imports: ["useRouteQuery"]
      },
      {
        from: "@vueuse/math",
        imports: ["useAverage"]
      },
      {
        from: "convert",
        imports: ["convert"]
      },
      {
        from: "change-case",
        imports: ["kebabCase", "capitalCase", "sentenceCase"]
      },
      {
        from: "kmh-to-mph",
        imports: [{ name: "default", as: "kmhToMph" }]
      }
    ]
  },
  // neo4j configuration
  neo4j: {
    uri: process.env.NEO4J_URI,
    auth: {
      type: "basic",
      username: process.env.NEO4J_USERNAME || "neo4j",
      password: process.env.NEO4J_PASSWORD || "password"
    }
  },
  // Echarts configuration
  echarts: {
    renderer: "canvas",
    charts: ["ScatterChart", "LineChart", "BarChart", "TreeChart", "GaugeChart", "PieChart"],
    components: ["DatasetComponent", "GridComponent", "TooltipComponent", "LegendComponent", "PolarComponent", "TransformComponent"],
    features: ["UniversalTransition", "LabelLayout"]
  },
  // Nuxt UI configuration
  ui: {
    theme: {
      colors: [
        "primary",
        "neutral",
        "warning",
        "error",
        "success",
        "ATP",
        "WTA",
        "ITF-M",
        "ITF-W",
        "info",
        "Singles",
        "Doubles",
        "Active",
        "Inactive",
        "Tour",
        "Challenger",
        "ITF",
        "Main",
        "Qualifying"
      ]
    }
  },
  // Custom icons
  icon: {
    customCollections: [
      {
        prefix: "flags",
        dir: "~/assets/flags",
        normalizeIconName: false
      }
    ]
  }
})
