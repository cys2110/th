<script setup lang="ts">
import { ICONS } from "#imports"
import type { BreadcrumbItem, TabsItem } from "@nuxt/ui"

definePageMeta({ name: "tournament" })

const route = useRoute("tournament")
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()
tournamentStore.paramName = route.params.name

useHead({ title: () => tournamentStore.name })

const breadcrumbs: Array<BreadcrumbItem> = [{ label: "Tournaments", to: { name: "tournaments" } }]

const selectedTab = ref<"winners" | "numbers">("winners")

const tabItems = computed<Array<TabsItem>>(() => [
  { label: "Winners", value: "winners", icon: ICONS.trophy },
  { label: "By the Numbers", value: "numbers", icon: ICONS.stats }
])

const { data: tournament, refresh } = await useAsyncData(`tournament-${route.params.id}`, async () => {
  const { data, error } = await supabase.schema("tennis").from("tournament").select("*").eq("id", route.params.id).single()

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

const tournamentYears = computed(() => {
  const { established, abolished } = tournament.value || {}

  if (established) {
    if (abolished) {
      if (established === abolished) return String(established)

      return `${established}-${abolished}`
    }

    return `${established}-present`
  }

  return null
})
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header :ui="{ root: 'border-none mb-0 pb-0' }">
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template #title>
          <u-user
            :name="tournamentStore.name"
            :avatar="{
              src: tournament?.logo_url || '',
              loading: 'lazy',
              icon: ICONS.trophy
            }"
            :description="tournamentYears || undefined"
            size="3xl"
          />
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
            :icon="ui.icons.external"
            target="_blank"
          />
        </template>

        <template
          #description
          v-if="isAdmin && tournament"
        >
          <u-badge color="success">
            <nuxt-time
              :datetime="tournament.updated_at"
              year="numeric"
              month="long"
              day="numeric"
              hour="2-digit"
              minute="2-digit"
              time-zone="America/New_York"
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
        <tournament-winners v-if="selectedTab === 'winners'" />

        <tournament-numbers v-else />
      </u-page-body>
    </u-page>
  </u-container>
</template>
