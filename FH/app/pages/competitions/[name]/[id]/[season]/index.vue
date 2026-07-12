<script setup lang="ts">
import { formatDate } from "#imports"
import type { BreadcrumbItem } from "@nuxt/ui"
import { startCase } from "lodash"

definePageMeta({ name: "season" })

const route = useRoute("season")

const supabase = useSupabaseClient()

const seasonName = computed(() => decodeURIComponent(route.params.season as string))
const selectedTab = ref<"teams" | "fixtures" | "standings">("fixtures")

const {
  data: season,
  pending,
  refresh
} = await useAsyncData(
  () => `season-${route.params.id}-${route.params.season}`,
  async () => {
    const { data, error } = await supabase
      .from("season")
      .select("*, competition(name)")
      .eq("competition_id", route.params.id)
      .eq("name", seasonName.value)
      .single()

    if (error || !data) {
      console.error("Error fetching season:", error)
      return null
    }

    return data
  }
)

useHead({
  title: () => `${season.value?.competition.name || startCase(route.params.name as string)} ${season.value?.name}`,
  templateParams: { category: "Competitions" }
})

const breadcrumbs: Array<BreadcrumbItem> = [
  {
    label: "Competitions",
    to: { name: "competitions" }
  },
  {
    label: season.value?.competition.name || startCase(route.params.name as string),
    to: { name: "competition", params: { id: route.params.id, name: route.params.name } }
  }
]

const tabItems = [
  {
    label: "Standings",
    value: "standings"
  },
  {
    label: "Teams",
    value: "teams"
  },
  {
    label: "Fixtures",
    value: "fixtures"
  }
]
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header
        :title="seasonName"
        :ui="{ root: 'border-none mb-0 pb-0' }"
      >
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template
          #description
          v-if="season"
        >
          {{ formatDate(season.start_date, season.end_date) }}
        </template>

        <template #links>
          <!-- <dev-only>
            <lazy-federation-create
              hydrate-on-idle
              @refresh="refresh"
            />
          </dev-only> -->
        </template>

        <template #default>
          <u-tabs
            v-model="selectedTab"
            :items="tabItems"
            variant="link"
            :content="false"
            :ui="{ list: 'justify-end' }"
          />
        </template>
      </u-page-header>

      <u-page-body>
        <div v-if="season">
          <season-teams
            v-if="selectedTab === 'teams'"
            :season-id="season.id"
          />

          <season-fixtures
            v-else
            :season-id="season.id"
          />
        </div>
      </u-page-body>
    </u-page>
  </u-container>
</template>
