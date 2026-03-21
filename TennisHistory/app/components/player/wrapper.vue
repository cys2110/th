<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui"

const route = useRoute("player")
const router = useRouter()
const toast = useToast()

const {
  ui: { icons, colors }
} = useAppConfig()

const playerStore = usePlayerStore()
playerStore.paramName = route.params.name

const playerPages: Array<TabsItem> = [
  { label: "Overview", value: "player", icon: ICONS.profile },
  { label: "Activity", value: "activity", icon: ICONS.racquet },
  { label: "Titles and Finals", value: "titles-and-finals", icon: ICONS.one },
  { label: "Win-Loss Index", value: "wl-index", icon: ICONS.barChart },
  { label: "Stats", value: "stats", icon: ICONS.stats },
  { label: "Record", value: "record", icon: ICONS.trophy }
]

const currentPage = computed(() => playerPages.find(page => page.value === route.name))

const activeRoute = computed({
  get() {
    return route.name
  },
  set(tab) {
    router.push({ name: tab, params: { name: route.params.name, id: route.params.id } })
  }
})

// Set browser tab name here to set for all player sub-pages
useHead({
  title: () => currentPage.value?.label,
  templateParams: {
    category: () => playerStore.fullName
  }
})

const { data: player } = await useAsyncData("player", async () => {
  const supabase = useSupabaseClient()

  const { data, error } = await supabase
    .from("players")
    .select(
      "first_name, last_name, tour, ch_singles_date, ch_doubles_date, dod, turned_pro, retired, site_link, wiki_link, official_link, ...player_entry_mapping(entries(events(editions(year)))), player_country_mapping(countries(*))"
    )
    .eq("id", route.params.id)
    .is("player_country_mapping.end_date", null)
    .single()

  if (error || !data) {
    console.error("Error fetching player:", error)
    return null
  }

  const eventYears = useSorted(useArrayUnique(data.entries.map(entry => entry.events.editions?.year).filter(Boolean) as number[])).value

  return {
    first_name: data.first_name,
    last_name: data.last_name,
    tour: data.tour,
    activeYears: eventYears,
    ch_singles_date: data.ch_singles_date,
    ch_doubles_date: data.ch_doubles_date,
    turned_pro: data.turned_pro,
    retired: data.retired,
    dod: data.dod,
    country: data.player_country_mapping[0]?.countries,
    site_link: data.site_link,
    wiki_link: data.wiki_link,
    official_link: data.official_link
  }
})

watch(
  player,
  () => {
    if (player.value) {
      playerStore.firstName = player.value.first_name || ""
      playerStore.lastName = player.value.last_name || ""
      playerStore.tour = player.value.tour
      playerStore.activeYears = player.value.activeYears
    }
  },
  { immediate: true }
)

const isScraping = ref(false)

const scrapeEnabled = computed(() => {
  const singlesChDate = player.value?.ch_singles_date ? new Date(player.value?.ch_singles_date) : null
  const doublesChDate = player.value?.ch_doubles_date ? new Date(player.value?.ch_doubles_date) : null
  const cutoffDate = new Date("2001-01-01")

  if (
    (singlesChDate && singlesChDate < cutoffDate) ||
    (doublesChDate && doublesChDate < cutoffDate) ||
    (player.value?.retired && player.value.retired < 2024) ||
    player.value?.dod
  ) {
    return false
  }
  return true
})

const handleScrape = async () => {
  set(isScraping, true)

  await $fetch(`${FLASK_ROUTE}/${playerStore.tour?.toLowerCase()}/player/${route.params.id}`, {
    method: "GET",
    timeout: 120_000
  })
    .then(() => {
      toast.add({
        title: `${startCase(playerStore.fullName)} scraped`,
        icon: icons.success,
        color: "success"
      })

      reloadNuxtApp()
    })
    .catch(e => {
      console.error(e)
      toast.add({
        title: `Error scraping ${startCase(playerStore.fullName)}`,
        icon: icons.error,
        color: "error"
      })
    })
    .finally(() => {
      set(isScraping, false)
    })
}
</script>

<template>
  <u-page-header
    headline="Players"
    :title="playerStore.fullName"
    :ui="{
      root: 'border-none mb-0',
      description: 'text-md w-fit flex items-center gap-2'
    }"
  >
    <template
      #description
      v-if="player"
    >
      <country-link
        v-if="player.country?.id"
        :country="player.country"
        icon-only
      />

      <u-chip :color="playerStore.active ? 'Active' : 'Inactive'">
        <u-badge
          v-if="playerStore.tour"
          :label="playerStore.tour"
          :color="<keyof typeof colors>playerStore.tour"
        />
      </u-chip>

      <div>
        Years Active:
        {{
          playerStore.activeYears.length ?
            playerStore.activeYears.length > 1 ?
              `${playerStore.activeYears[0]}-${playerStore.activeYears[playerStore.activeYears.length - 1]}`
            : playerStore.activeYears[0]
          : "—"
        }}
        ({{ playerStore.activeYears.length }} year{{ playerStore.activeYears.length === 1 ? "" : "s" }})
      </div>
    </template>

    <template #default>
      <u-tabs
        :items="playerPages"
        variant="link"
        :content="false"
        v-model="activeRoute"
        :ui="{ list: 'justify-end' }"
      />
    </template>

    <template #links>
      <slot name="header-links" />

      <dev-only>
        <u-button
          v-if="scrapeEnabled"
          color="warning"
          :icon="isScraping ? ICONS.downloading : ICONS.download"
          @click="handleScrape"
        />
      </dev-only>

      <u-button
        v-if="player?.site_link"
        :icon="icons.external"
        :href="player.site_link"
        target="_blank"
      />

      <u-button
        v-if="player?.official_link"
        :href="player.official_link"
        :icon="ICONS.player"
        target="_blank"
      />

      <u-button
        v-if="player?.wiki_link"
        :icon="ICONS.wikipedia"
        :href="player.wiki_link"
        target="_blank"
      />
    </template>
  </u-page-header>
</template>
