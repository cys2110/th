<script setup lang="ts">
import { isDefined } from "#imports"
import type { AccordionItem } from "@nuxt/ui"

const route = useRoute("edition")
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const { data, pending, refresh } = await useAsyncData<Array<AccordionItem>>(
  () => `entry-info-${JSON.stringify(route.params)}`,
  async () => {
    const { data: entryInfoData, error: entryInfoError } = await supabase
      .schema("tennis")
      .from("entry_info")
      .select("*")
      .eq("tournament_id", route.params.id)
      .eq("year", Number(route.params.year))
      .eq("edition_no", Number(route.params.edition_no))

    if (entryInfoError) {
      console.error("Error fetching entry info", entryInfoError)
      return []
    }

    return ENTRY_INFO_CATEGORIES.map(category => ({
      label: category.label,
      key: category.key,
      entries: entryInfoData.filter(eid => eid.info_type === category.key && (!("status" in category) || category.status === eid.status))
    })).filter(category => category.entries.length)
  },
  { default: () => [] }
)
</script>

<template>
  <u-container class="max-w-4xl space-y-6 my-6">
    <u-accordion
      v-if="data.length"
      :items="data"
      type="multiple"
    >
      <template #body="{ item }">
        <div
          v-for="(entry, index) in item.entries"
          :key="index"
          class="flex justify-between items-center my-1"
        >
          <div class="flex items-center gap-2">
            <u-badge
              :color="entry.tour"
              :label="entry.tour"
              class="min-w-20"
            />

            <u-badge
              :color="entry.draw"
              :label="entry.draw"
              class="min-w-20"
            />

            <player-link :team="entry.team" />
          </div>

          <div v-if="isDefined(entry.rank)">
            <span
              v-if="data.find(i => i.label === 'Protected Ranking' && i.entries.find((e: any) => e.entry_id === entry.entry_id && e.status === 'PR'))"
            >
              PR
            </span>
            <span>{{ entry.rank }}</span>
          </div>

          <div v-else-if="entry.reason">
            <span>{{ entry.reason }}</span>
            <span v-if="entry.teammate">({{ entry.teammate }})</span>
          </div>
        </div>
      </template>
    </u-accordion>

    <empty
      v-else
      :title="`No entry information available for ${tournamentStore.name} ${route.params.year}`"
      @refresh="refresh"
    />
  </u-container>
</template>
