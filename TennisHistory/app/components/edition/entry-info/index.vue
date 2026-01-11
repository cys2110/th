<script setup lang="ts">
const {
  params: { edId, year }
} = useRoute("edition")
const {
  ui: { icons, colors }
} = useAppConfig()
const toast = useToast()
const updating = ref(false)
const tournamentStore = useTournamentStore()

const { data, status, refresh } = await useFetch("/api/edition/entry-info", {
  query: { edId },
  default: () => []
})

const groupedRelationships = computed(() => {
  const sortedRelationships = useSorted(data, (a, b) => a.relationship.localeCompare(b.relationship)).value
  return groupBy(sortedRelationships, "relationship")
})

const updateEntryInfo = async () => {
  set(updating, true)

  try {
    const response = await $fetch("/api/edition/entry-info/relationship", {
      query: { id: edId }
    })
    if (response.success) {
      toast.add({
        title: "Entry info updated successfully",
        icon: icons.success,
        color: "success"
      })
      refresh()
    } else {
      toast.add({
        title: "Error updating entry info",
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (error) {
    console.error("Error updating entry information:", error)
  }

  set(updating, false)
}
</script>

<template>
  <dashboard-subpanel
    title="Entry Information"
    :icon="icons.info"
  >
    <template #right>
      <dev-only>
        <u-button
          @click="updateEntryInfo"
          :icon="updating ? ICONS.uploading : icons.upload"
          color="Doubles"
        />

        <edition-entry-info-update
          :refresh
          icon-only
        />
      </dev-only>

      <edition-entry-info-chart
        :data
        :status
      />
    </template>

    <u-collapsible
      v-if="data.length"
      v-for="[relationship, entries] in Object.entries(groupedRelationships)"
      :key="relationship"
    >
      <u-button
        class="group my-2"
        :label="`${relationship}s`"
        color="neutral"
        block
        :trailing-icon="icons.chevronDown"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
      />

      <template #content>
        <div
          v-for="(entry, index) in entries"
          :key="entry.id"
          class="flex justify-between items-center text-sm my-1"
        >
          <div class="flex items-center gap-2">
            <u-badge
              :color="(entry.tour as keyof typeof colors)"
              :label="entry.tour"
              class="min-w-20"
            />

            <u-badge
              :color="entry.type"
              :label="entry.type"
              class="min-w-20"
            />

            <u-badge
              :color="entry.draw"
              :label="entry.draw"
              class="min-w-20"
            />

            <dev-only>
              <edition-entry-info-update
                :relationship
                :entry
                :refresh
              >
                {{ entry.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") }}
              </edition-entry-info-update>

              <template #fallback>
                <template
                  v-for="(player, idx) in entry.team"
                  :key="player.id"
                >
                  <u-separator
                    v-if="idx > 0"
                    orientation="vertical"
                    class="h-4"
                  />
                  <player-link :player />
                </template>
              </template>
            </dev-only>
          </div>

          <div v-if="entry.rank || entry.reason">
            <dev-only>
              <edition-entry-info-update
                :relationship
                :entry
                :refresh
              >
                <span v-if="relationship === 'Last Direct Acceptance' && entry.rank">
                  {{ (entry.status === "PR" && entry.draw === "Main") || (entry.q_status === "PR" && entry.draw === "Qualifying") ? "P" : ""
                  }}{{ entry.rank }}
                </span>
                <span v-else-if="['Withdrawal', 'Retirement', 'Walkover', 'Default'].includes(relationship) && entry.reason">
                  {{ entry.teammate ? `${entry.reason} (${entry.teammate})` : entry.reason }}
                </span>
              </edition-entry-info-update>

              <template #fallback>
                <span v-if="relationship === 'Last Direct Acceptance' && entry.rank">
                  {{ (entry.status === "PR" && entry.draw === "Main") || (entry.q_status === "PR" && entry.draw === "Qualifying") ? "P" : ""
                  }}{{ entry.rank }}
                </span>
                <span v-else-if="['Withdrawal', 'Retirement', 'Walkover', 'Default'].includes(relationship) && entry.reason">
                  {{ entry.teammate ? `${entry.reason} (${entry.teammate})` : entry.reason }}
                </span>
              </template>
            </dev-only>
          </div>
        </div>
      </template>
    </u-collapsible>

    <empty
      v-else
      :message="`No entry information available for ${tournamentStore.name} ${year}`"
    >
      <dev-only>
        <edition-entry-info-update :refresh />
      </dev-only>
    </empty>
  </dashboard-subpanel>
</template>
