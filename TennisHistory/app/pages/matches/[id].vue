<script setup lang="ts">
import { ICONS } from "#imports"

definePageMeta({ name: "match" })

const route = useRoute("match")
const { ui } = useAppConfig()
const supabase = useSupabaseClient()
const toast = useToast()

const { isAdmin } = useAuthState()

const {
  data: match,
  pending,
  refresh
} = await useAsyncData(
  () => `match-details-${route.params.id}`,
  async () => {
    const { data, error } = await fetchMatchDetails(supabase, route.params.id)

    if (error || !data) {
      console.error("Error fetching match:", error)
      return null
    }

    return data
  }
)

useHead({
  title: () =>
    match.value ?
      `${match.value.team1?.team.map(player => player.full_name).join("/")} v ${match.value.team2?.team.map(player => player.full_name).join("/")}`
    : "Matches",
  templateParams: {
    category:
      match.value ? `${match.value.tournament_name} ${match.value.year}${match.value.edition_no ? `[${match.value.edition_no}]` : ""}` : undefined
  }
})

const handleScrapeMatch = async () => {
  if (!match.value?.match_link) return

  const result = await $fetch("/api/scrape-match", {
    query: {
      href: match.value.match_link,
      tour: match.value.tour
    }
  })

  if (result.success) {
    toast.add({
      title: "Match scraped",
      icon: ui.icons.success,
      color: "success"
    })
    refresh()
  } else {
    console.error("Error scraping match:", result)
    toast.add({
      title: "Error scraping match",
      icon: ui.icons.error,
      color: "error"
    })
  }
}
</script>

<template>
  <u-container class="max-w-7xl">
    <u-page>
      <!--To do - h2h button-->
      <u-page-header
        v-if="match"
        headline="Matches"
        :title="`${match.team1?.team.map(player => player.full_name).join('/')} v ${match.team2?.team.map(player => player.full_name).join('/')}`"
        :description="`${match.tournament_name} ${match.year}${match.edition_no ? `[${match.edition_no}]` : ''} — ${match.round}${match.group_name ? ` ${match.group_name}` : ''}`"
      >
        <template #links>
          <u-button
            v-if="isAdmin && match.match_link"
            :icon="ICONS.download"
            @click="handleScrapeMatch"
          />
        </template>
      </u-page-header>

      <u-page-body>
        <template v-if="match">
          <match-details :match />

          <match-table
            v-if="match.team_1_stats && match.team_2_stats"
            :match
          />
        </template>

        <empty
          v-else
          title="No match found"
          @refresh="refresh"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
