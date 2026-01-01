<script setup lang="ts">
import { CalendarDate } from "@internationalized/date"
import type { TableRow } from "@nuxt/ui"

definePageMeta({ name: "activity" })

const {
  params: { id, name }
} = useRoute("activity")
const router = useRouter()

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()
const viewModeStore = useViewModeStore()
const playerStore = usePlayerStore()

const year = useRouteQuery("year", playerStore.activeYears.slice(-1)[0] || new Date().getFullYear(), { transform: Number })
</script>

<template>
  <div> Page: players/[name]/[id]/activity </div>
</template>
