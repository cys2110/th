<script setup lang="ts">
import type { BreadcrumbItem, TabsItem } from "@nuxt/ui"

const { name, params } = useRoute("player")
const router = useRouter()
const toast = useToast()

const {
  ui: { icons, colors }
} = useAppConfig()

const { isAdmin } = useAuthState()
const playerStore = usePlayerStore()
playerStore.paramName = params.name

const breadcrumbs = ref<Array<BreadcrumbItem>>([{ label: "Players", icon: ICONS.player, to: { name: "players" } }])

const playerPages: Array<TabsItem> = [
  { label: "Overview", value: "player", icon: ICONS.profile },
  { label: "Activity", value: "activity", icon: ICONS.racquet },
  { label: "Titles and Finals", value: "titles-and-finals", icon: ICONS.one },
  { label: "Win-Loss Index", value: "wl-index", icon: ICONS.barChart },
  { label: "Stats", value: "stats", icon: ICONS.stats },
  { label: "Record", value: "record", icon: ICONS.trophy }
]

const currentPage = computed(() => playerPages.find(page => page.value === name))

const activeRoute = computed({
  get() {
    return name
  },
  set(tab) {
    router.push({ name: tab, params })
  }
})

// Set browser tab name here to set for all player sub-pages
useHead({
  title: () => currentPage.value?.label,
  templateParams: {
    category: () => playerStore.fullName
  }
})

const { data: player } = await useAsyncData(params.id, async () => {
  const supabase = useSupabaseClient()

  const { data: playerListData, error: playerListError } = await supabase
    .from("player_list_view")
    .select("first_tournament, last_tournament, country")
    .eq("id", params.id)
    .single()

  if (playerListError || !playerListData) {
    console.error("Error fetching player view:", playerListError)
  }

  const { data, error } = await supabase
    .from("players")
    .select("first_name, last_name, full_name, tour, ch_singles_date, ch_doubles_date, dod, site_link, wiki_link, official_link")
    .eq("id", params.id)
    .single()

  if (error || !data) {
    console.error("Error fetching player:", error)
    return null
  }

  return {
    first_name: data.first_name,
    last_name: data.last_name,
    full_name: data.full_name,
    tour: data.tour,
    ch_singles_date: data.ch_singles_date,
    ch_doubles_date: data.ch_doubles_date,
    dod: data.dod,
    country: playerListData!.country as unknown as CountryInterface,
    site_link: data.site_link,
    wiki_link: data.wiki_link,
    official_link: data.official_link,
    first_tournament: playerListData!.first_tournament,
    last_tournament: playerListData!.last_tournament
  }
})

watch(
  player,
  () => {
    if (player.value) {
      const { full_name, tour, first_tournament, last_tournament } = player.value

      playerStore.playerName = full_name || ""
      playerStore.tour = tour
      playerStore.isActive = !!(last_tournament && last_tournament === new Date().getFullYear())
      playerStore.activeYears =
        first_tournament && last_tournament ? Array.from({ length: last_tournament - first_tournament + 1 }, (_, i) => first_tournament + i) : []
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
    (player.value?.last_tournament && player.value.last_tournament < 2024) ||
    player.value?.dod
  ) {
    return false
  }
  return true
})

const handleScrape = async () => {
  set(isScraping, true)

  await $fetch(`${FLASK_ROUTE}/${playerStore.tour?.toLowerCase()}/player/${params.id}`, {
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
    :ui="{
      root: 'border-none mb-0 pb-0',
      description: 'text-md w-fit flex items-center gap-2'
    }"
  >
    <template #headline>
      <u-breadcrumb :items="breadcrumbs" />
    </template>

    <template #title>
      <div v-if="player?.first_name && player?.last_name"> {{ player.first_name }} {{ player.last_name.toUpperCase() }} </div>

      <div v-else>{{ playerStore.fullName }}</div>
    </template>

    <template
      #description
      v-if="player"
    >
      <country-link
        v-if="player.country?.id"
        :country="player.country"
        icon-only
      />

      <u-chip :color="playerStore.isActive ? 'Active' : 'Inactive'">
        <u-badge
          v-if="playerStore.tour"
          :label="playerStore.tour"
          :color="<keyof typeof colors>playerStore.tour"
        />
      </u-chip>

      <div>
        Years Active:
        {{
          player.first_tournament && player.last_tournament ?
            player.first_tournament === player.last_tournament ?
              player.first_tournament
            : `${player.first_tournament}-${player.last_tournament}`
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
      >
        <template #default="{ item }">
          <u-link
            :to="{ name: item.value as any, params }"
            class="text-inherit hover:text-inherit"
          >
            {{ item.label }}
          </u-link>
        </template>
      </u-tabs>
    </template>

    <template #links>
      <u-button
        v-if="scrapeEnabled && isAdmin"
        :icon="isScraping ? ICONS.downloading : ICONS.download"
        @click="handleScrape"
      />

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
