<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui"
import { kebabCase, startCase } from "lodash"
import { type QueryData } from "@supabase/supabase-js"
import { ICONS, POSITION_GROUP_MAPPING } from "#imports"

definePageMeta({ name: "player" })

const route = useRoute("player")
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const playerQuery = () => supabase.from("player_details").select("*, country!nationality_country_id(name)").eq("id", route.params.id).single()

type PlayerType = QueryData<ReturnType<typeof playerQuery>>

const {
  data: player,
  pending,
  refresh
} = await useAsyncData(
  () => `player-${route.params.id}`,
  async () => {
    const { data, error } = await playerQuery()

    if (error || !data) {
      console.error("Error fetching player:", error)
      return null
    }

    return data
  }
)

useHead({
  title: () => player.value?.label || startCase(route.params.name as string),
  templateParams: { category: "Players" }
})

const breadcrumbs: Array<BreadcrumbItem> = [{ label: "Players", to: { name: "players" } }]

const age = computed(() => {
  if (player.value?.dob) {
    return {
      label: "Age",
      value: formatDate(player.value.dob, player.value?.dod),
      age: getAge(new Date(player.value.dob), player.value?.dod ? new Date(player.value.dod) : new Date())
    }
  } else if (player.value?.dod) {
    return {
      label: "Died",
      value: formatDate(player.value.dod)
    }
  }

  return null
})
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header :title="player?.label || startCase(route.params.name as string)">
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>
      </u-page-header>

      <u-page-body>
        <div class="flex flex-wrap gap-3 justify-evenly">
          <u-page-feature
            v-if="player?.aka"
            :title="player?.aka"
            description="AKA"
          />

          <u-page-feature
            v-if="age"
            :description="age.label"
          >
            <template #title>
              <div>{{ age.value }}</div>
              <div
                v-if="age.age"
                class="text-sm font-medium"
                >{{ age.age }}</div
              >
            </template>
          </u-page-feature>

          <u-page-feature
            v-if="player?.country?.name"
            :title="player.country.name"
            :icon="player.icon"
            description="Nationality"
          />

          <u-page-feature
            v-if="player?.birth_country"
            :icon="player.birth_country_icon"
            :title="player.birth_place || player.birth_country"
            description="Birth Place"
          />

          <u-page-feature
            v-if="player?.height_cm"
            :title="`${player.height_cm} cm`"
            description="Height"
          />

          <u-page-feature
            v-if="player?.preferred_foot"
            :title="startCase(player.preferred_foot)"
            description="Preferred Foot"
          />

          <u-page-feature
            v-if="player?.team_name"
            :title="player.team_name"
            description="Current Team"
            :to="{ name: 'team', params: { id: player.team_id!, name: kebabCase(player.team_name) } }"
          >
            <template #leading>
              <u-avatar
                :src="player?.team_logo || ''"
                loading="lazy"
                :icon="ICONS.team"
              />
            </template>
          </u-page-feature>

          <u-page-feature
            v-if="player?.current_position"
            :title="POSITION_GROUP_MAPPING[player.current_position]"
            description="Current Position"
          />
        </div>

        <div class="my-6">
          <player-teams />
        </div>
      </u-page-body>
    </u-page>
  </u-container>
</template>
