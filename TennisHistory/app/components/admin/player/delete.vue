<script setup lang="ts">
import { prettifyJson, type PlayerType, type VenueType } from "#imports"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const { players, pending, searchTerm } = usePlayerSearch()

const deletePerson = ref(false)
const isDeleting = ref(false)
const response = ref<Array<Player & { full_name: string; nationality_id: string }> | null>()
const error = ref()

const selectedPlayers = ref<Array<PlayerType>>([])

const onDelete = async () => {
  set(isDeleting, true)

  try {
    const { data, error: deleteError } = await supabase
      .schema("tennis")
      .from("player")
      .delete()
      .in(
        "id",
        selectedPlayers.value.map(v => v.id)
      )
      .select("*, ...people(full_name, nationality_id)")

    if (deleteError) {
      set(error, deleteError.message)
    } else {
      set(selectedPlayers, [])
      set(response, data)

      if (deletePerson.value) {
        const { error: deletePersonError } = await supabase
          .schema("tennis")
          .from("people")
          .delete()
          .in(
            "id",
            data.map(p => p.person_id)
          )

        if (deletePersonError) {
          set(error, `Error deleting associated people records: ${deletePersonError.message}`)
        }
      }
    }
  } finally {
    set(isDeleting, false)
  }
}
</script>

<template>
  <div class="flex gap-6 items-start">
    <u-card class="basis-2/3">
      <template #header>
        <div class="font-semibold">Delete Players</div>
      </template>

      <div class="space-y-3">
        <u-checkbox
          v-model="deletePerson"
          label="Delete associated person record?"
        />

        <u-input-menu
          v-model="selectedPlayers"
          v-model:search-term="searchTerm"
          :loading="pending"
          clear
          ignore-filter
          placeholder="Players"
          label-key="full_name"
          :items="players"
          multiple
          class="w-full"
        >
          <template #tags-item-text="{ item }">
            <div class="flex items-center gap-1">
              <u-icon :name="item.icon" />
              {{ item.full_name }}
            </div>
          </template>

          <template #item-leading="{ item }">
            <u-icon :name="item.icon" />
          </template>
        </u-input-menu>
      </div>

      <template #footer>
        <u-button
          color="error"
          :icon="ui.icons.error"
          label="Delete"
          @click="onDelete"
          :loading="isDeleting"
          :disabled="isDeleting || !selectedPlayers.length"
          block
        />
      </template>
    </u-card>

    <div class="space-y-6 basis-1/3">
      <u-alert
        v-if="error"
        color="error"
        variant="subtle"
        title="Error deleting players"
        :description="error"
      />

      <u-page-card
        v-if="response"
        title="Response"
      >
        <prose-code class="w-full">
          <pre v-html="prettifyJson(response)" />
        </prose-code>
      </u-page-card>
    </div>
  </div>
</template>
