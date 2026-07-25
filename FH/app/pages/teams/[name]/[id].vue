<script setup lang="ts">
import { TEAM_TYPE_MAPPING } from "#imports"
import type { BreadcrumbItem } from "@nuxt/ui"
import { startCase } from "lodash"

definePageMeta({ name: "team" })

const route = useRoute("team")
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const selectedTab = ref<"players" | "coaches" | "fixtures" | "overview">("players")

const {
  data: team,
  pending,
  refresh
} = await useAsyncData(
  () => `team-${route.params.id}`,
  async () => {
    const { data, error } = await supabase
      .from("team")
      .select("*, national_association(id, name, logo_url), country(*), venue(*)")
      .eq("id", route.params.id)
      .single()

    if (error || !data) {
      console.error("Error fetching team:", error)
      return null
    }

    return data
  }
)

useHead({
  title: () => `${team.value?.name || startCase(route.params.name as string)}`,
  templateParams: { category: "Teams" }
})

const breadcrumbs: Array<BreadcrumbItem> = [{ label: "Teams", to: { name: "teams" } }]

const tabItems = [
  {
    label: "Overview",
    value: "overview"
  },
  {
    label: "Players",
    value: "players"
  },
  {
    label: "Coaches",
    value: "coaches"
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
        :title="team?.name || startCase(route.params.name as string)"
        :ui="{ root: 'border-none mb-0 pb-0' }"
      >
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template #links>
          <u-badge
            v-if="team"
            :label="TEAM_TYPE_MAPPING[team.type]"
            color="secondary"
          />

          <u-button
            v-if="team?.website"
            :to="team.website"
            :icon="ui.icons.external"
          />
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
          <team-overview v-if="selectedTab === 'overview'" />

          <team-players v-else-if="selectedTab === 'players'" />

          <team-coaches
            v-else-if="selectedTab === 'coaches'"
            :federation-id="team.national_association_id"
          />

          <team-fixtures v-else />
        </div>
      </u-page-body>
    </u-page>
  </u-container>
</template>
