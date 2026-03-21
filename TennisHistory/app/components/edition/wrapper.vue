<script setup lang="ts">
import type { BreadcrumbItem, TabsItem } from "@nuxt/ui"

const route = useRoute("edition")
const router = useRouter()

const tournamentStore = useTournamentStore()
tournamentStore.paramName = route.params.name
tournamentStore.id = route.params.id

const editionPages: Array<TabsItem> = [
  { label: "Overview", value: "edition", icon: ICONS.overview },
  { label: "Results", value: "results", icon: ICONS.cards },
  { label: "Draws", value: "draws", icon: ICONS.draw, ui: { leadingIcon: "rotate-270" } }
]

const currentPage = computed(() => editionPages.find(page => page.value === route.name))

const activeRoute = computed({
  get() {
    return route.name
  },
  set(tab) {
    router.push({ name: tab, params: route.params })
  }
})

// Set browser tab name here to set for all player sub-pages
useHead({
  title: () => currentPage.value?.label,
  templateParams: {
    category: () => `${tournamentStore.name} ${route.params.year}`
  }
})

const breadcrumbs = computed<Array<BreadcrumbItem>>(() => [
  { icon: ICONS.trophy, to: { name: "tournaments" }, label: "Tournaments" },
  { label: tournamentStore.name, to: { name: "tournament", params: { id: tournamentStore.id, name: tournamentStore.paramName } } }
])

const { data: edition } = await useAsyncData("edition", async () => {
  const supabase = useSupabaseClient()

  const { data, error } = await supabase
    .from("editions")
    .select("wiki_link, tours, tournaments(id, name), events(id)")
    .eq("id", Number(route.params.edId))
    .single()

  if (error || !data) {
    console.error("Error fetching edition:", error)
    return null
  }

  return data
})

watch(
  edition,
  () => {
    if (edition.value) {
      tournamentStore.tournamentName = edition.value.tournaments?.name || ""
      tournamentStore.tours = edition.value.tours!
    }
  },
  { immediate: true }
)
</script>

<template>
  <u-page-header
    :title="route.params.year"
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
        :items="editionPages"
        variant="link"
        :content="false"
        v-model="activeRoute"
        :ui="{ list: 'justify-end' }"
      />
    </template>

    <template #links>
      <slot name="header-links" />

      <u-button
        v-if="edition?.wiki_link"
        :icon="ICONS.wikipedia"
        :href="edition.wiki_link"
        target="_blank"
      />

      <event-create v-if="route.name === 'edition'" />

      <template v-else-if="route.name === 'results' || route.name === 'draws'">
        <match-country-create v-if="COUNTRY_DRAWS.includes(route.params.id)" />

        <match-create v-else />
      </template>
    </template>
  </u-page-header>
</template>
