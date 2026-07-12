<script setup lang="ts">
import { ICONS } from "#imports"
import { kebabCase } from "lodash"

const props = defineProps<{
  seasonId: string
}>()

const route = useRoute("season")
const supabase = useSupabaseClient()

const {
  data: teams,
  pending,
  refresh
} = await useAsyncData(
  () => `${route.params.id}-${route.params.season}-teams`,
  async () => {
    const { data, error } = await supabase
      .from("team")
      .select("*, team_season!inner(season_id)")
      .eq("team_season.season_id", props.seasonId)
      .order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching teams:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)
</script>

<template>
  <u-container>
    <div class="flex justify-end mb-6">
      <lazy-season-team-create
        :season-id="seasonId"
        hydrate-on-idle
        @refresh="refresh"
      />
    </div>

    <u-page-columns class="xl:columns-4 2xl:columns-5">
      <u-page-feature
        v-for="team in teams"
        :key="team.id"
        :title="team.name"
        :description="team.nicknames[0]"
        :to="{ name: 'team-season', params: { ...route.params, team_id: team.id } }"
      >
        <template #leading>
          <u-avatar
            :src="team.logo_url || ''"
            loading="lazy"
            :icon="ICONS.team"
          />
        </template>
      </u-page-feature>
    </u-page-columns>
  </u-container>
</template>
