<script setup lang="ts">
import { startCase } from "lodash"
import type { BreadcrumbItem } from "@nuxt/ui"

definePageMeta({ name: "team-season" })

const route = useRoute("team-season")
const supabase = useSupabaseClient()

const seasonName = computed(() => decodeURIComponent(route.params.season as string))
const selectedTab = ref<"players" | "fixtures">("players")

const {
  data: team,
  pending,
  refresh
} = await useAsyncData(
  () => `team-season-${route.params.id}-${route.params.season}-${route.params.team_id}`,
  async () => {
    const { data, error } = await supabase
      .from("team_season")
      .select(
        `
        team(name, nicknames, colours, logo_url, national_association(id, name)),
        season!inner(id, competition_id, name, competition(name))
      `
      )
      .eq("team_id", route.params.team_id)
      .eq("season.name", seasonName.value)
      .eq("season.competition_id", route.params.id)
      .single()

    if (error || !data) {
      console.error("Error fetching team:", error)
      return null
    }

    return data
  }
)

useHead({
  title: () =>
    team.value ?
      `${team.value?.team.name} ${team.value.season.name} - ${team.value.season.competition.name}`
    : `Team - ${startCase(route.params.name as string)} ${seasonName.value}`,
  templateParams: { category: "Competitions" }
})

const breadcrumbs: Array<BreadcrumbItem> = [
  {
    label: "Competitions",
    to: { name: "competitions" }
  },
  {
    label: team.value?.season.competition.name || startCase(route.params.name as string),
    to: { name: "competition", params: { id: route.params.id, name: route.params.name } }
  },
  {
    label: team.value?.season.name || seasonName.value,
    to: { name: "season", params: { id: route.params.id, name: route.params.name, season: route.params.season } }
  }
]

const tabItems = [
  {
    label: "Players",
    value: "players"
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
        :title="team?.team.name"
        :ui="{ root: 'border-none mb-0 pb-0' }"
      >
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <!-- <template
          #description
          v-if="season"
        >
          {{ formatDate(season.start_date, season.end_date) }}
        </template> -->

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
        <div v-if="team">
          <season-squad
            v-if="selectedTab === 'players'"
            :season-id="team.season.id"
          />
        </div>

        <!-- <season-fixtures v-else /> -->
      </u-page-body>
    </u-page>
  </u-container>
</template>
