<script setup lang="ts">
import { EventsEntryInfoUpdate } from "#components"

const {
  ui: { icons }
} = useAppConfig()
const {
  params: { edId, tour }
} = useRoute("event")
const { devMode } = useRuntimeConfig().public
const toast = useToast()
const overlay = useOverlay()
const editEntryInfo = overlay.create(EventsEntryInfoUpdate)
const updating = ref(false)

defineShortcuts({
  meta_shift_u: () => updateEntryInfo()
})

const { data, status, refresh } = await useFetch<EntryInterface[]>("/api/events/entry-info", {
  query: { edId, tour },
  default: () => []
})

const groupedRelationships = computed(() => {
  if (data.value.length) {
    const relationships = useArrayUnique(data.value.map(entry => entry.relationship))

    return relationships.value.map(relationship => ({
      relationship,
      entries: data.value.filter(entry => entry.relationship === relationship)
    }))
  }

  return []
})

const updateEntryInfo = async () => {
  set(updating, true)
  try {
    const response = await $fetch("/api/events/entry-info/relationship", {
      query: { id: `${edId}-${tour}` }
    })
    if ((response as any).ok) {
      toast.add({
        title: "Entry info updated successfully",
        icon: icons.check,
        color: "success"
      })
      await refresh()
    } else {
      toast.add({
        title: "Error updating entry info",
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: "Error updating entry info",
      description: (e as Error).message,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(updating, false)
  }
}

const handleEditEntryInfo = (relationship: string, entry: EntryInterface) => {
  editEntryInfo.open({
    relationship,
    entry,
    refresh
  })
}
</script>

<template>
  <dashboard-subpanel
    id="entry-info"
    title="Entry Information"
    :icon="icons.info"
  >
    <template #right>
      <dev-only>
        <u-button
          @click="updateEntryInfo"
          :icon="updating ? ICONS.uploading : icons.upload"
        />
        <events-entry-info-update :refresh />
      </dev-only>
      <events-entry-info-chart
        v-if="data.length"
        :data
      />
    </template>

    <u-collapsible
      v-if="groupedRelationships.length"
      v-for="relationship in groupedRelationships"
      :key="relationship.relationship"
    >
      <u-button
        class="group my-2"
        :label="`${relationship.relationship}s`"
        color="neutral"
        block
        :trailing-icon="icons.chevronDown"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
      />

      <template #content>
        <div
          v-for="(entry, index) in relationship.entries"
          :key="`${relationship.relationship}-${index}`"
          class="flex justify-between items-center text-sm gap-3 my-1"
        >
          <div
            class="flex items-center gap-2"
            @click.capture.prevent="devMode ? handleEditEntryInfo(relationship.relationship, entry) : undefined"
            :class="{ 'cursor-pointer': devMode }"
          >
            <u-badge
              :color="entry.type"
              :label="entry.type"
            />
            <u-badge
              :color="entry.draw"
              :label="entry.draw"
            />
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
          </div>

          <div>
            <span v-if="relationship.relationship === 'Last Direct Acceptance' && entry.rank">
              {{ (entry.status === "PR" && entry.draw === "Main") || (entry.q_status === "PR" && entry.draw === "Qualifying") ? "P" : ""
              }}{{ entry.rank }}
            </span>
            <span v-else-if="['Withdrawal', 'Retirement', 'Walkover', 'Default'].includes(relationship.relationship) && entry.reason">
              {{ entry.teammate ? `${entry.reason} (${entry.teammate})` : entry.reason }}
            </span>
          </div>
        </div>
      </template>
    </u-collapsible>

    <cards-loading-collapsible v-else-if="status === 'pending'" />

    <u-empty
      v-else
      title="No entry information available"
      :icon="icons.caution"
    >
      <template
        #actions
        v-if="devMode"
      >
        <events-entry-info-update :refresh />
      </template>
    </u-empty>
  </dashboard-subpanel>
</template>
