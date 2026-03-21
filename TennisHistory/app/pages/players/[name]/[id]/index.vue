<script setup lang="ts">
import type { PageAnchor } from "@nuxt/ui"

definePageMeta({ name: "player" })

const {
  params: { id, name }
} = useRoute("player")

const {
  ui: { icons }
} = useAppConfig()

const playerStore = usePlayerStore()

const pageAnchors: Array<PageAnchor> = [
  { label: "Details", icon: ICONS.cards, to: "#details" },
  { label: "Win-Loss", icon: ICONS.stats, to: "#wl" },
  { label: "Most Frequent H2H", icon: ICONS.h2h, to: "#h2h" },
  { label: "Recent Events", icon: ICONS.years, to: "#recent-events" }
]

// API call
const { data: player, pending } = await useAsyncData("player-details", async () => {
  const supabase = useSupabaseClient()

  const { data, error } = await supabase
    .from("players")
    .select(
      `
      *,
      player_country_mapping(*, countries(*)),
      player_coach_mapping(*, people(*))
    `
    )
    .eq("id", id)
    .single()

  if (error || !data) {
    console.error("Error fetching player:", error)
    return null
  }

  const { player_country_mapping, player_coach_mapping, ...rest } = data

  return {
    ...rest,
    countries: player_country_mapping.map(mapping => ({
      start_date: mapping.start_date,
      end_date: mapping.end_date,
      id: mapping.id,
      country: mapping.countries
    })),
    coaches: player_coach_mapping.map(mapping => ({
      id: mapping.id,
      years: mapping.years,
      status: mapping.status,
      coach: mapping.people
    }))
  } as PlayerInterface
})
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-page-anchors :links="pageAnchors" />
        </u-page-aside>
      </template>

      <player-wrapper />

      <u-page-body>
        <player-details
          v-if="player || pending"
          :player
          :pending
        />

        <empty
          v-else
          :message="`No details available about ${playerStore.fullName}`"
          :icon="ICONS.peopleOff"
        />

        <!-- <player-wl-table /> -->

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- <player-h2h-table /> -->

          <!-- <player-recent-events /> -->
        </div>
      </u-page-body>
    </u-page>
  </u-container>
</template>
