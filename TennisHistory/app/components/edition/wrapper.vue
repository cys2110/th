<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui"

const {
  name,
  params: { edId, id, year, name: paramName }
} = useRoute("edition")
const router = useRouter()
const tournamentStore = useTournamentStore()

watchOnce(
  () => paramName,
  () => {
    if (!tournamentStore.name) tournamentStore.name = startCase(paramName)
    tournamentStore.id = id
    tournamentStore.edId = edId
  },
  { immediate: true }
)

const { data: edition } = await useFetch("/api/edition", {
  key: edId,
  query: { edId },
  onResponseError: ({ error }) => console.error("Error fetching edition:", error)
})

watch(
  edition,
  () => {
    if (edition.value) {
      tournamentStore.name = edition.value.tournament?.name || startCase(paramName)
      tournamentStore.tours = edition.value.tours
    }
  },
  { immediate: true }
)

const editionPages = [
  { label: "Overview", value: "edition", icon: ICONS.overview },
  { label: "Results", value: "results", icon: ICONS.cards },
  { label: "Draws", value: "draws", icon: ICONS.draw, ui: { leadingIcon: "rotate-270" } }
]

const currentPage = computed(() => editionPages.find(page => page.value === name))

useHead({
  title: () => currentPage.value?.label,
  templateParams: {
    category: () => `${tournamentStore.name} ${year}`
  }
})

const activeRoute = computed({
  get() {
    return name
  },
  set(tab) {
    router.push({ name: tab, params: { name: paramName, id, year, edId } })
  }
})

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { icon: ICONS.trophy, to: { name: "tournaments" }, label: "Tournaments" },
  { label: tournamentStore.name, to: { name: "tournament", params: { id, name: paramName } } }
])
</script>

<template>
  <u-page-header
    :title="year"
    :ui="{
      root: 'border-none mb-0',
      description: 'text-md w-fit flex items-center gap-2'
    }"
  >
    <template #headline>
      <u-breadcrumb :items="breadcrumbs" />
    </template>

    <template #default>
      <u-tabs
        v-model="activeRoute"
        :content="false"
        :items="editionPages"
        variant="link"
        :ui="{ list: 'justify-end' }"
      />
    </template>

    <template #links>
      <u-button
        v-if="edition?.wiki_link"
        :href="edition.wiki_link"
        :icon="ICONS.wikipedia"
        target="_blank"
      />
      <slot name="header-links" />
    </template>
  </u-page-header>
</template>
