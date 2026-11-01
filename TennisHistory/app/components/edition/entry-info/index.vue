<script setup lang="ts">
import { ICONS, STATUS_MAPPING } from "#imports"
import type { AccordionItem } from "@nuxt/ui"
import { isDefined, set } from "@vueuse/core"
import type { TablesUpdate } from "~/types/database.types"

const route = useRoute("edition")
const { ui } = useAppConfig()
const toast = useToast()
const supabase = useSupabaseClient()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const ENTRY_INFO_TABLES = ["defaults", "ldas", "entry_status", "retirements", "walkovers", "withdrawals"] as const
type EntryInfoEdit = Pick<TablesUpdate<{ schema: "tennis" }, "defaults">, "reason" | "player_id"> &
  Pick<TablesUpdate<{ schema: "tennis" }, "ldas">, "rank"> &
  Pick<TablesUpdate<{ schema: "tennis" }, "entry_status">, "status">

const updatedEntryInfo = ref<Record<string, any>>({
  defaults: {},
  ldas: {},
  entry_status: {},
  retirements: {},
  walkovers: {},
  withdrawals: {}
})
const isSaving = ref(false)

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

const handleDelete = async (id: number, type: "entry_status" | "retirements" | "ldas" | "withdrawals" | "walkovers" | "defaults") => {
  const { error } = await supabase.schema("tennis").from(type).delete().eq("id", id)

  if (error) {
    console.error("Error deleting entry info:", error)
    toast.add({
      title: "Error deleting entry info",
      icon: ui.icons.error,
      color: "error"
    })

    return
  }

  refresh()

  if (id in updatedEntryInfo.value[type]) {
    delete updatedEntryInfo.value[type][id]
  }

  toast.add({
    title: "Entry info successfully deleted",
    icon: ui.icons.success,
    color: "success"
  })
}

const handleSubmit = async () => {
  set(isSaving, true)

  try {
    for (const type of ENTRY_INFO_TABLES) {
      const entries: Record<string, EntryInfoEdit> = updatedEntryInfo.value[type] ?? {}
      for (const [id, value] of Object.entries(entries)) {
        const tennis = supabase.schema("tennis")
        const { error } =
          type === "ldas" ?
            await tennis
              .from("ldas")
              .update({ rank: value.rank ?? null })
              .eq("id", Number(id))
          : type === "entry_status" ? await tennis.from("entry_status").update({ status: value.status }).eq("id", Number(id))
          : await tennis.from(type).update({ reason: value.reason, player_id: value.player_id }).eq("id", Number(id))

        if (error) {
          console.error(`Error updating entry info ${id}`, error)
          toast.add({
            title: "Error updating entry info",
            icon: ui.icons.error,
            color: "error"
          })
          return
        }
      }
    }

    refresh()
    toast.add({
      title: "Entry info successfully updated",
      icon: ui.icons.success,
      color: "success"
    })

    for (const type of ENTRY_INFO_TABLES) {
      updatedEntryInfo.value[type] = {}
    }
  } finally {
    set(isSaving, false)
  }
}
</script>

<template>
  <u-container class="max-w-4xl space-y-6 my-6">
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
          :icon="ui.icons.reload"
          @click="refresh()"
        />

        <u-button
          :icon="ICONS.save"
          :loading="isSaving"
          :loading-icon="ICONS.uploading"
          @click="handleSubmit"
          :disabled="isSaving || !Object.values(updatedEntryInfo).some(entries => Object.keys(entries).length > 0)"
        />
      </u-field-group>
    </div>

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
            <u-checkbox
              v-if="isAdmin"
              highlight
              :icon="ui.icons.info"
              :model-value="entry.id in updatedEntryInfo[item.key]"
              @update:model-value="
                () => {
                  if (entry.id in updatedEntryInfo[item.key]) {
                    delete updatedEntryInfo[item.key][entry.id]
                  } else {
                    updatedEntryInfo[item.key][entry.id] = {
                      reason: entry.reason,
                      player_id: entry.player_id,
                      rank: entry.rank,
                      status: entry.status
                    }
                  }
                }
              "
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

            <player-link :team="entry.team" />
          </div>

          <u-field-group
            v-if="entry.id in updatedEntryInfo[item.key]"
            class="w-fit"
          >
            <form-input-number
              v-if="item.key === 'ldas'"
              v-model="updatedEntryInfo[item.key][entry.id].rank"
              placeholder="Rank"
            />

            <u-input-menu
              v-else-if="item.key === 'entry_status'"
              v-model="updatedEntryInfo[item.key][entry.id].status"
              :items="Object.entries(STATUS_MAPPING).map(([value, label]) => ({ label, value }))"
              value-key="value"
              clear
              placeholder="Status"
            />

            <template v-else>
              <form-input
                v-model="updatedEntryInfo[item.key][entry.id].reason"
                placeholder="Reason"
              />

              <u-input-menu
                v-if="entry.team.length > 1"
                v-model="updatedEntryInfo[item.key][entry.id].player_id"
                :items="entry.team"
                value-key="id"
                label-key="full_name"
                class="w-full"
                clear
              />
            </template>

            <u-button
              color="error"
              :icon="ui.icons.error"
              @click="handleDelete(entry.id, item.key)"
            />
          </u-field-group>

          <div v-else-if="isDefined(entry.rank)">
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
