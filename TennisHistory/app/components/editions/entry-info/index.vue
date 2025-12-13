<script setup lang="ts">
import { groupBy } from "lodash"

const { tours } = defineProps<{
  tours: (keyof typeof tourEnum)[]
}>()

const {
  params: { edId }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const updating = ref(false)

const { data, refresh } = await useFetch("/api/editions/entry-info", {
  query: { edId },
  default: () => []
})

const groupedRelationships = computed(() => {
  const sortedRelationships = useSorted(data, (a, b) => a.relationship.localeCompare(b.relationship)).value
  return groupBy(sortedRelationships, "relationship")
})

const updateEntryInfo = async () => {
  set(updating, true)

  const response = await $fetch("/api/editions/entry-info/relationship", {
    query: { id: edId }
  })
  if ((response as any).ok) {
    toast.add({
      title: "Entry info updated successfully",
      icon: icons.check,
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
        />

        <editions-entry-info-update
          :refresh
          icon-only
        />
      </dev-only>

      <editions-entry-info-chart
        v-if="data.length"
        :data
        :tours
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
              :color="entry.tour"
              :label="entry.tour"
            />

            <u-badge
              :color="entry.type"
              :label="entry.type"
            />

            <u-badge
              :color="entry.draw"
              :label="entry.draw"
            />

            <dev-only>
              <editions-entry-info-update
                :relationship
                :entry
                :refresh
              >
                {{ entry.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") }}
              </editions-entry-info-update>

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
                  <players-link :player />
                </template>
              </template>
            </dev-only>
          </div>

          <div v-if="entry.rank || entry.reason">
            <dev-only>
              <editions-entry-info-update
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
              </editions-entry-info-update>

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
      message="No entry information available"
      class="mx-2"
    >
      <dev-only>
        <editions-entry-info-update :refresh />
      </dev-only>
    </empty>
  </dashboard-subpanel>
</template>
