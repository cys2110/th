<script setup lang="ts">
import type { BreadcrumbItem, TabsItem } from "@nuxt/ui"

definePageMeta({ name: "tournament" })

const {
  params: { id, name }
} = useRoute("tournament")

const {
  ui: { icons }
} = useAppConfig()

const supabase = useSupabaseClient()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()
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

const breadcrumbs: Array<BreadcrumbItem> = [{ label: "Tournaments", to: { name: "tournaments" } }]

const { data: tournament } = await useAsyncData(id, async () => {
  const { data, error } = await supabase.from("tournaments").select("*").eq("id", Number(id)).single()

  if (error || !data) {
    console.error("Error fetching tournament:", error)
    return null
  }

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
  <u-container>
    <u-page>
      <u-page-header
        :title="tournamentStore.name"
        :ui="{
          root: 'border-none mb-0 pb-0',
          description: 'text-md w-fit flex items-center gap-2'
        }"
      >
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template #links>
          <u-badge
            v-for="tour in tournament?.tours"
            :key="tour"
            :label="tour"
            :color="tour"
          />

          <u-button
            v-if="tournament?.website"
            :href="tournament.website"
            target="_blank"
            :icon="icons.external"
          />
        </template>

        <template #description>
          <div v-if="tournament?.established">
            <span>{{ tournament.established }}</span>
            <span v-if="!tournament.abolished"> - present</span>
            <span v-else-if="tournament.established !== tournament.abolished"> - {{ tournament.abolished }}</span>
          </div>

          <u-badge
            v-if="tournament?.updated_at && isAdmin"
            color="success"
          >
            <nuxt-time
              :datetime="tournament.updated_at"
              year="numeric"
              month="long"
              day="numeric"
              hour="2-digit"
              minute="2-digit"
              time-zone="UTC"
            />
          </u-badge>
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
        <tournament-winners v-if="selectedTab === 'Winners'" />

        <tournament-numbers v-else />
      </u-page-body>
    </u-page>
  </u-container>
</template>
