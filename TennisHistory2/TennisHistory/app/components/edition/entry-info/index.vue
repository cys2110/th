<script setup lang="ts">
import type { AccordionItem } from "@nuxt/ui"

const {
  params: { edId, year }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const updatedEntryInfo = ref<Record<string, any>>({})
const isSaving = ref(false)

const key = computed(() => `${edId}-entry-info`)

const { data, pending, refresh } = await useAsyncData<Array<AccordionItem>>(
  key,
  async () => {
    const { data, error } = await supabase
      .from("entries")
      .select(
        `
        id, match_type,
        player_entry_mapping(countries(*), players(id, first_name, last_name, full_name)),
        retirements(*),
        ldas(*),
        withdrawals(*),
        walkovers(*),
        defaults(*),
        entry_status(*),
        events!inner(edition_id, tour)
      `
      )
      .eq("events.edition_id", Number(edId))
      .is("team_name", null)

    if (error || !data) {
      console.error("Error fetching entries:", error)
      return []
    }

    const entryInfo: Array<AccordionItem> = []

    const statuses = Object.entries(STATUS_MAPPING).map(([key, value]) => ({
      key,
      label: value
    }))

    for (const status of statuses) {
      const entries = data.filter(entry => entry.entry_status.find(mapping => mapping.status === status.key))

      if (entries.length)
        entryInfo.push({
          label: status.label,
          key: status.key,
          entries: entries.map(entry => {
            const statusEntries = entry.entry_status.find(mapping => mapping.status === status.key)

            return {
              id: entry.id,
              draw: statusEntries!.draw,
              tour: entry.events.tour!,
              team: entry.player_entry_mapping.map(entry => ({
                id: entry.players.id,
                full_name: entry.players.full_name,
                country: entry.countries
              })),
              status_id: statusEntries!.id
            }
          })
        })
    }

    const reasonFields = [
      { label: "Retirements", key: "retirements" },
      { label: "Walkovers", key: "walkovers" },
      { label: "Withdrawals", key: "withdrawals" },
      { label: "Defaults", key: "defaults" }
    ]

    for (const field of reasonFields) {
      // @ts-expect-error
      const entries = data.filter(entry => entry[field.key as keyof typeof entry]?.length)

      if (entries.length)
        entryInfo.push({
          label: field.label,
          key: field.key,
          slot: "reasons",
          entries: entries.flatMap(entry => {
            const fieldEntry = entry[field.key as keyof typeof entry]

            // @ts-expect-error
            return fieldEntry.map(e => ({
              id: entry.id,
              relationship_id: e.id,
              draw: e.draw,
              tour: entry.events.tour!,
              team: entry.player_entry_mapping.map((entry: any) => ({
                id: entry.players.id,
                full_name: entry.players.full_name,
                country: entry.countries
              })),
              reason: e.reason,
              player_id: e.player_id,
              teammate: e.player_id ? entry.player_entry_mapping.find((en: any) => en.players.id === e.player_id)?.players.full_name : null
            }))
          })
        })
    }

    const ldas = data.filter(entry => entry.ldas.length)

    if (ldas.length)
      entryInfo.push({
        key: "ldas",
        slot: "ldas",
        label: "Last Direct Acceptances",
        entries: ldas.map(entry => {
          const lda = entry.ldas[0]

          return {
            id: entry.id,
            lda_id: lda!.id,
            draw: lda!.draw,
            tour: entry.events.tour!,
            team: entry.player_entry_mapping.map(entry => ({
              id: entry.players.id,
              full_name: entry.players.full_name,
              country: entry.countries
            })),
            rank: lda!.rank,
            pr: !!entry.entry_status.find(status => status.status === "PR" && status.draw === lda!.draw)
          }
        })
      })

    return entryInfo.sort((a, b) => a.label!.localeCompare(b.label!))
  },
  { default: () => [] }
)

const handleDelete = async (id: string, type: "entry_status" | "retirements" | "ldas" | "withdrawals" | "walkovers" | "defaults") => {
  const { error } = await supabase.from(type).delete().eq("id", id)

  if (error) {
    console.error("Error deleting entry:", error)
    toast.add({
      title: "Error deleting entry info",
      icon: icons.error,
      color: "error"
    })
  }

  refresh()
  if (id in updatedEntryInfo.value) {
    delete updatedEntryInfo.value[id]
  }
  toast.add({
    title: "Entry info successfully deleted",
    icon: icons.success,
    color: "success"
  })
}

const handleSubmit = async () => {
  set(isSaving, true)

  try {
    for (const [id, entry] of Object.entries(updatedEntryInfo.value)) {
      const { type, ...rest } = entry

      const { error } = await supabase.from(type).update(rest).eq("id", id)

      if (error) {
        console.error(`Error updating entry info ${id}`, error)
        toast.add({
          title: "Error updating entry info",
          icon: icons.error,
          color: "error"
        })
      }
    }

    refresh()
    toast.add({
      title: "Entry info successfully updated",
      icon: icons.success,
      color: "success"
    })

    set(updatedEntryInfo, {})
  } finally {
    set(isSaving, false)
  }
}
</script>

<template>
  <u-container class="max-w-4xl">
    <div
      v-if="isAdmin"
      class="flex justify-end mb-4"
    >
      <u-field-group class="w-fit">
        <lazy-edition-entry-info-create
          hydrate-on-idle
          @refresh="refresh"
        />

        <u-button
          :icon="icons.reload"
          @click="refresh()"
        />

        <u-button
          :icon="ICONS.save"
          :loading="isSaving"
          :loading-icon="ICONS.uploading"
          @click="handleSubmit"
          :disabled="isSaving || Object.keys(updatedEntryInfo).length === 0"
        />
      </u-field-group>
    </div>

    <u-accordion
      v-if="data.length"
      :items="data"
      type="multiple"
    >
      <template #ldas-body="{ item }">
        <div
          v-for="entry in (item as AccordionItem).entries"
          :key="entry.lda_id"
          class="flex justify-between items-center my-1"
        >
          <div class="flex items-center gap-2">
            <u-checkbox
              v-if="isAdmin"
              highlight
              :model-value="entry.lda_id in updatedEntryInfo"
              @update:model-value="
                () => {
                  if (entry.lda_id in updatedEntryInfo) {
                    delete updatedEntryInfo[entry.lda_id]
                  } else {
                    updatedEntryInfo[entry.lda_id] = {
                      type: 'ldas',
                      rank: entry.rank
                    }
                  }
                }
              "
              :icon="icons.info"
            />
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
            <player-link :players="entry.team" />
          </div>

          <u-field-group
            v-if="entry.lda_id in updatedEntryInfo"
            class="w-fit"
          >
            <form-input-number
              v-model="updatedEntryInfo[entry.lda_id].rank"
              placeholder="Rank"
            />

            <u-button
              color="error"
              :icon="icons.error"
              @click="handleDelete(entry.lda_id, 'ldas')"
            />
          </u-field-group>

          <div v-else-if="isDefined(entry.rank)">
            <span v-if="entry.pr">PR</span>
            <span>{{ entry.rank }}</span>
          </div>
        </div>
      </template>

      <template #reasons-body="{ item }">
        <div
          v-for="entry in (item as AccordionItem).entries"
          :key="entry.relationship_id"
          class="flex justify-between items-center my-1"
        >
          <div class="flex items-center gap-2">
            <u-checkbox
              v-if="isAdmin"
              highlight
              :model-value="entry.relationship_id in updatedEntryInfo"
              @update:model-value="
                () => {
                  if (entry.relationship_id in updatedEntryInfo) {
                    delete updatedEntryInfo[entry.relationship_id]
                  } else {
                    updatedEntryInfo[entry.relationship_id] = {
                      type: (item as AccordionItem).key,
                      reason: entry.reason,
                      player_id: entry.player_id
                    }
                  }
                }
              "
              :icon="icons.info"
            />
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
            <player-link :players="entry.team" />
          </div>

          <u-field-group
            v-if="entry.relationship_id in updatedEntryInfo"
            class="w-fit"
          >
            <form-input
              v-model="updatedEntryInfo[entry.relationship_id].reason"
              placeholder="Reason"
            />

            <u-input-menu
              v-if="entry.team.length > 1"
              v-model="updatedEntryInfo[entry.relationship_id].player_id"
              :items="entry.team"
              value-key="id"
              label-key="full_name"
              class="w-full"
              clear
            />

            <u-button
              color="error"
              :icon="icons.error"
              @click="handleDelete(entry.relationship_id, (item as AccordionItem).key)"
            />
          </u-field-group>

          <div v-else-if="entry.reason">
            <span>{{ entry.reason }}</span>
            <span v-if="entry.teammate"> ({{ entry.teammate }})</span>
          </div>
        </div>
      </template>

      <template #body="{ item }">
        <div
          v-for="entry in item.entries"
          :key="entry.status_id"
          class="flex justify-between items-center my-1"
        >
          <div class="flex items-center gap-2">
            <u-checkbox
              v-if="isAdmin"
              highlight
              :model-value="entry.lda_id in updatedEntryInfo"
              @update:model-value="
                () => {
                  if (entry.lda_id in updatedEntryInfo) {
                    delete updatedEntryInfo[entry.lda_id]
                  } else {
                    updatedEntryInfo[entry.lda_id] = {
                      type: 'entry_status',
                      status: (item as AccordionItem).key
                    }
                  }
                }
              "
              :icon="icons.info"
            />
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
            <player-link :players="entry.team" />
          </div>

          <u-field-group
            v-if="entry.status_id in updatedEntryInfo"
            class="w-fit"
          >
            <u-input-menu
              v-model="updatedEntryInfo[entry.status_id].status"
              :items="Object.entries(STATUS_MAPPING).map(([value, label]) => ({ label, value }))"
              value-key="value"
              clear
              placeholder="Status"
            />

            <u-button
              color="error"
              :icon="icons.error"
              @click="handleDelete(entry.status_id, 'entry_status')"
            />
          </u-field-group>
        </div>
      </template>
    </u-accordion>

    <u-empty
      v-else
      :title="`No entry information available for ${tournamentStore.name} ${year}`"
      description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
    >
      <template #actions>
        <u-button
          label="Refresh"
          :icon="icons.reload"
          @click="refresh()"
        />
      </template>
    </u-empty>
  </u-container>
</template>
