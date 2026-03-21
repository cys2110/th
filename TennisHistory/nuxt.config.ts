// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxt/eslint", "@nuxt/image", "@nuxtjs/supabase", "@pinia/nuxt", "@vueuse/nuxt", "nuxt-echarts", "@nuxt/ui"],
  // Set page transitions
  app: {
    pageTransition: {
      name: "page",
      mode: "out-in"
    }
  },

  // Set scroll behaviour
  router: {
    options: {
      scrollBehaviorType: "smooth"
    }
  },

  // CSS path
  css: ["~/assets/css/main.css"],

  // Turn on typed router
  experimental: {
    typedPages: true
  },

  supabase: {
    redirect: false
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
          "useLocalStorage",
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
        from: "convert",
        imports: ["convert"]
      },
      {
        from: "lodash",
        imports: ["kebabCase", "startCase", "groupBy", "isEqual", "cloneDeep", "toArray"]
      }
    ]
  },

  // Echarts configuration
  echarts: {
    renderer: "canvas",
    charts: ["ScatterChart", "LineChart", "BarChart", "TreeChart", "GaugeChart", "PieChart"],
    components: [
      "DatasetComponent",
      "GridComponent",
      "TooltipComponent",
      "LegendComponent",
      "PolarComponent",
      "TransformComponent",
      "TitleComponent"
    ],
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
      ],
      defaultVariants: {
        size: "sm"
      }
    }
  }
})
