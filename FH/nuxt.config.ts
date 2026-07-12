// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxt/eslint", "@nuxt/image", "@pinia/nuxt", "@vueuse/nuxt", "@nuxtjs/supabase", "@nuxt/ui"],

  // Set page transitions
  app: {
    pageTransition: {
      name: "page",
      mode: "out-in"
    }
  },

  // Set scroll behaviour
  router: { options: { scrollBehaviorType: "smooth" } },

  runtimeConfig: { public: { dev: process.env.NODE_ENV === "development" || false } },

  vite: {
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit"]
    }
  },

  // CSS path
  css: ["~/assets/css/main.css"],

  // Turn on typed router
  experimental: { typedPages: true },

  supabase: {
    redirect: false,
    clientOptions: {
      db: {
        schema: "football"
      }
    }
  },

  ui: {
    theme: {
      colors: ["primary", "secondary", "warning", "info", "error", "success", "neutral"],
      defaultVariants: {
        size: "sm"
      }
    }
  }
})
