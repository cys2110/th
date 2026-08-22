<script setup lang="ts">
import type { BreadcrumbItem, TabsItem } from "@nuxt/ui"

const route = useRoute("edition")
const router = useRouter()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()
tournamentStore.paramName = route.params.name

const editionPages: Array<TabsItem> = [
  { label: "Overview", value: "edition", icon: ICONS.overview },
  { label: "Results", value: "results", icon: ICONS.scores },
  { label: "Draws", value: "draws", icon: ICONS.draw, ui: { leadingIcon: "rotate-270" } }
]

const currentPage = computed(() => editionPages.find(page => page.value === route.params.name))

const activeRoute = computed({
  get() {
    return route.params.name
  },
  set(tab) {
    router.push({ name: tab as "edition" | "draws" | "results", params: route.params })
  }
})

// Set browser tab name here to set for all player sub-pages
useHead({
  title: () => currentPage.value?.label,
  templateParams: {
    category: () => `${tournamentStore.name} ${route.params.year}`
  }
})

const { data: edition } = await useAsyncData(
  () => `edition-${JSON.stringify(route.params)}`,
  async () => {
    const { data, error } = await supabase
      .schema("tennis")
      .from("editions")
      .select("id, tours, tournament(id, name, logo_url)")
      .eq("tournament_id", route.params.id)
      .eq("year", Number(route.params.year))
      .eq("edition_no", Number(route.params.edition_no))
      .single()

    if (error || !data) {
      console.error("Error fetching edition:", error || undefined)
      return null
    }

    return data
  }
)

watch(
  edition,
  () => {
    if (edition.value) {
      const { tournament, tours, id } = edition.value
      tournamentStore.tournamentName = tournament?.name || ""
      tournamentStore.tours = tours || []
      tournamentStore.editionId = id
    }
  },
  { immediate: true }
)

const breadcrumbs = computed<Array<BreadcrumbItem>>(() => [
  { label: "Tournaments", to: { name: "tournaments" } },
  {
    label: tournamentStore.name,
    to: { name: "tournament", params: { id: route.params.id, name: route.params.name } },
    avatar: { src: edition.value?.tournament.logo_url || "", loading: "lazy", icon: ICONS.trophy }
  }
])
</script>

<template>
  <u-page-header :ui="{ root: 'border-none mb-0 pb-0' }">
    <template #headline>
      <u-breadcrumb :items="breadcrumbs" />
    </template>

    <template #title> {{ route.params.year }}{{ Number(route.params.edition_no) ? ` [${route.params.edition_no}]` : "" }} </template>

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
            :to="{ name: item.value as any, params: route.params }"
            class="text-inherit hover:text-inherit"
          >
            {{ item.label }}
          </u-link>
        </template>
      </u-tabs>
    </template>
  </u-page-header>
</template>
