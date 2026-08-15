<script setup lang="ts">
import type { BreadcrumbItem, TabsItem } from "@nuxt/ui"

const { name, params } = useRoute("edition")
const router = useRouter()

const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()
tournamentStore.paramName = params.name

const editionPages: Array<TabsItem> = [
  { label: "Overview", value: "edition", icon: ICONS.overview },
  { label: "Results", value: "results", icon: ICONS.scores },
  { label: "Draws", value: "draws", icon: ICONS.draw, ui: { leadingIcon: "rotate-270" } }
]

const currentPage = computed(() => editionPages.find(page => page.value === name))

const activeRoute = computed({
  get() {
    return name
  },
  set(tab) {
    router.push({ name: tab, params })
  }
})

// Set browser tab name here to set for all player sub-pages
useHead({
  title: () => currentPage.value?.label,
  templateParams: {
    category: () => `${tournamentStore.name} ${params.year}`
  }
})

const breadcrumbs = computed<Array<BreadcrumbItem>>(() => [
  { icon: ICONS.trophy, label: "Tournaments", to: { name: "tournaments" } },
  { label: tournamentStore.name, to: { name: "tournament", params: { id: params.id, name: params.name } } }
])

const { data: edition } = await useAsyncData(params.edId, async () => {
  const { data, error } = await supabase
    .from("editions")
    .select("tours, wiki_link, tournaments(id, name), events(id)")
    .eq("id", Number(params.edId))
    .single()

  if (error || !data) {
    console.error("Error fetching edition:", error || undefined)
    return null
  }

  return data
})

watch(
  edition,
  () => {
    if (edition.value) {
      const { tournaments, tours } = edition.value
      tournamentStore.tournamentName = tournaments?.name || ""
      tournamentStore.tours = tours || []
    }
  },
  { immediate: true }
)
</script>

<template>
  <u-page-header
    :title="params.year"
    :ui="{
      root: 'border-none mb-0 pb-0',
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
      >
        <template #default="{ item }">
          <u-link
            :to="{ name: item.value as any, params }"
            class="text-inherit hover:text-inherit"
          >
            {{ item.label }}
          </u-link>
        </template>
      </u-tabs>
    </template>

    <template #links>
      <u-button
        v-if="edition?.wiki_link"
        :icon="ICONS.wikipedia"
        :href="edition.wiki_link"
        target="_blank"
      />
    </template>
  </u-page-header>
</template>
