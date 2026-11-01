<script setup lang="ts">
import { ICONS } from "#imports"
import type { BreadcrumbItem } from "@nuxt/ui"
import { object, string } from "zod"

const playerSchema = object({
  site_link: string().nullable(),
  official_link: string().nullable(),
  tour: TourEnum,
  image_url: string().nullable(),
  full_name: string(),
  country: countrySchema
})

const route = useRoute("player")
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const { isAdmin } = useAuthState()
const playerStore = usePlayerStore()
playerStore.paramName = route.params.name

const playerPages = [
  { label: "Profile", icon: ICONS.profile, to: "player" },
  { label: "Activity", icon: ICONS.calendar, to: "activity" },
  { label: "Titles and Finals", icon: ICONS.trophy, to: "titles-and-finals" },
  { label: "Record", icon: ICONS.player, to: "record" },
  { label: "Win-Loss Index", icon: ICONS.stats, to: "wl-index" },
  { label: "Stats", icon: ICONS.barChart, to: "stats" },
  { label: "Rankings History", icon: ICONS.ranking, to: "rankings" }
] as const

const currentPage = computed(() => playerPages.find(page => page.to === route.params.name))

const { data: player } = await useAsyncData(`player-${route.params.id}`, async () => {
  const { data, error } = await supabase
    .schema("tennis")
    .from("player")
    .select("site_link, official_link, tour, image_url, ...people(full_name, country!nationality_id(*))")
    .eq("id", route.params.id)
    .single()

  if (error || !data) {
    console.error("Error fetching player", error || undefined)
    return null
  }

  const parsedData = playerSchema.safeParse(data)

  if (parsedData.success && parsedData.data) {
    return parsedData.data
  } else {
    console.error("Error parsing player", parsedData.error)
    return null
  }
})

watch(
  player,
  () => {
    if (player.value) {
      const { full_name, tour } = player.value
      playerStore.tour = tour
      playerStore.playerName = full_name
    }
  },
  { immediate: true }
)

// Set browser tab name herer to set for all player sub-pages
useHead({
  title: () => currentPage.value?.label,
  templateParams: {
    category: () => playerStore.fullName
  }
})

const breadcrumbs = computed<Array<BreadcrumbItem>>(() => [{ label: "Players", to: { name: "players" } }])
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header :ui="{ root: 'pb-1', wrapper: 'py-8' }">
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template #title>
          <u-user
            :name="playerStore.fullName"
            :avatar="{
              src: player?.image_url || '',
              loading: 'lazy',
              icon: ICONS.player
            }"
            size="3xl"
          />
        </template>

        <template #links>
          <div
            v-if="player"
            class="flex items-center gap-2"
          >
            <u-badge
              :color="player.tour"
              :label="player.tour"
            />

            <country-link
              :country="player.country"
              icon-only
              :size="6"
            />

            <u-button
              v-if="player.official_link"
              :icon="ICONS.player"
              :href="player.official_link"
              target="_blank"
            />

            <u-button
              v-if="player.site_link"
              :icon="ui.icons.external"
              :href="player.site_link"
              target="_blank"
            />

            <u-button
              v-if="isAdmin"
              :icon="ICONS.download"
            />
          </div>
        </template>

        <template #default>
          <div class="flex justify-end gap-1">
            <u-button
              v-for="page in playerPages"
              :key="page.label"
              :label="page.label"
              :to="{ name: page.to, params: route.params }"
              :icon="page.icon"
              active-class="text-primary!"
              variant="link"
              color="neutral"
              size="lg"
            />
          </div>
        </template>
      </u-page-header>

      <u-page-body>
        <slot />
      </u-page-body>
    </u-page>
  </u-container>
</template>
