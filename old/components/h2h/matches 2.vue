<script setup lang="ts">
import { H2hCardMatches, H2hListMatches } from "#components"
defineProps<{ tour: "ATP" | "WTA" }>()
const appConfig = useAppConfig()
const route = useRoute()
const toast = useToast()
const { viewMode } = useViewMode()

const p1Name = computed(() => decodeName(route.params.p1Name as string))
const p2Name = computed(() => decodeName(route.params.p2Name as string))

type H2HMatchType = Pick<EventInterface, "id" | "tournament" | "surface" | "year"> & {
  match: Pick<MatchInterface, "match_no" | "sets" | "winner" | "round" | "tbs" | "incomplete">
}

// API call
const { data: matches, status } = await useFetch<H2HMatchType[]>("/api/h2h/matches", {
  query: { p1Id: route.params.p1Id, p2Id: route.params.p2Id },
  default: () => [],
  onResponseError: ({ error }) => {
    toast.add({
      title: `Error fetching matches for ${p1Name.value} v. ${p2Name.value}`,
      description: error?.message,
      icon: appConfig.ui.icons.error,
      color: "error"
    })
    showError(error!)
  }
})
</script>

<template>
  <dashboard-subpanel
    title="Matches"
    :icon="ICONS.upcoming"
  >
    <component
      :is="viewMode === 'cards' ? H2hCardMatches : H2hListMatches"
      :key="viewMode"
      :matches
      :status
      :tour
    />
  </dashboard-subpanel>
</template>
