<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui"

const route = useRoute("edition")
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()
tournamentStore.paramName = route.params.name

const editionPages = [
  { label: "Overview", icon: ICONS.overview, to: "edition" },
  { label: "Results", icon: ICONS.scores, to: "results" },
  { label: "Draws", icon: ICONS.draw, to: "draws", iconClass: "rotate-270" }
] as const

const currentPage = computed(() => editionPages.find(page => page.to === route.params.name))

// Set browser tab name here to set for all edition sub-pages
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
      .select("id, tours, tournament(id, name, logo_url, mens_id, womens_id)")
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
      tournamentStore.ids = { mens: tournament.mens_id || null, womens: tournament.womens_id, edition: id }
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
  <u-page-header :ui="{ root: 'pb-1', wrapper: 'py-8' }">
    <template #headline>
      <u-breadcrumb :items="breadcrumbs" />
    </template>

    <template #title> {{ route.params.year }}{{ Number(route.params.edition_no) ? ` [${route.params.edition_no}]` : "" }} </template>

    <template #default>
      <div class="flex justify-end gap-3">
        <u-button
          v-for="page in editionPages"
          :key="page.label"
          :label="page.label"
          :to="{ name: page.to, params: route.params }"
          :icon="page.icon"
          :ui="{ leadingIcon: 'iconClass' in page ? page.iconClass : '' }"
          active-class="text-primary!"
          variant="link"
          color="neutral"
          size="lg"
        />
      </div>
    </template>
  </u-page-header>
</template>
