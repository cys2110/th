<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui"

definePageMeta({ name: "tournament" })

const {
  params: { id, name }
} = useRoute("tournament")

const {
  ui: { colors, icons }
} = useAppConfig()

const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()
tournamentStore.id = id
tournamentStore.paramName = name

useHead({ title: () => tournamentStore.name })

const selectedTab = ref<"Winners" | "Numbers">("Winners")

const tabItems = computed<Array<TabsItem>>(() => [
  {
    label: "Winners",
    value: "Winners",
    icon: ICONS.trophy
  },
  {
    label: "By the Numbers",
    value: "Numbers",
    icon: ICONS.stats,
    disabled: COUNTRY_DRAWS.includes(id) || id === "9210"
  }
])

const { data: tournament, refresh } = await useAsyncData(id, async () => {
  const { data, error } = await supabase.from("tournaments").select("*").eq("id", Number(id)).single()

  if (error || !data) {
    console.error("Error fetching tournament:", error)
    return null
  }

  tournamentStore.tournamentName = data.name

  return data
})

watch(
  tournament,
  () => {
    if (tournament.value) {
      tournamentStore.tournamentName = tournament.value.name
      tournamentStore.tours = tournament.value.tours || []
    }
  },
  { immediate: true }
)
</script>

<template>
  <u-container class="max-w-7xl">
    <u-page>
      <u-page-header
        headline="Tournaments"
        :title="tournamentStore.name"
        :ui="{
          root: 'border-none mb-0',
          description: 'text-md w-fit flex items-center gap-2'
        }"
      >
        <template #links>
          <u-button
            v-if="tournament?.website"
            :href="tournament.website"
            target="_blank"
            :icon="icons.external"
          />
        </template>

        <template #description>
          <u-badge
            v-for="tour in tournament?.tours"
            :key="tour"
            :label="tour"
            :color="<keyof typeof colors>tour"
          />

          <div>
            <span v-if="tournament?.established">{{ tournament?.established }}</span>
            <span v-if="tournament?.established && !tournament?.abolished"> - present</span>
            <span v-else-if="tournament?.abolished && tournament?.established !== tournament?.abolished"> - {{ tournament?.abolished }}</span>
          </div>

          <u-badge
            v-if="tournament?.updated_at"
            color="success"
            :label="`Updated: ${formatDate(tournament.updated_at)}`"
          />
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
        <dev-only>
          <tournament-update
            v-if="tournament"
            :tournament
            @refresh="refresh"
          />
        </dev-only>

        <tournament-winners v-if="selectedTab === 'Winners'" />

        <!-- <tournament-numbers v-else /> -->
      </u-page-body>
    </u-page>
  </u-container>
</template>
