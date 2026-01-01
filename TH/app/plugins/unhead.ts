/** @module app/plugins/unhead - Adds the TemplateParamsPlugin to unhead */

import { TemplateParamsPlugin } from "@unhead/vue/plugins"

export default defineNuxtPlugin(nuxtApp => {
  const unhead = injectHead()
  unhead.use(TemplateParamsPlugin)
})
