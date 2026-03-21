<script setup lang="ts">
const {
  params: { id, edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()

const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const viewType = ref("By Player")
const refresh = ref(0)
const isUpdating = ref(false)

const updateActivityInfo = async () => {
  set(isUpdating, true)

  try {
    const { error } = await supabase.rpc("update_activity", { edition_id: Number(edId) })

    if (error) {
      console.error("Error updating activity:", error)
      toast.add({
        title: "Error updating activity",
        icon: icons.error,
        color: "error"
      })
    } else {
      toast.add({
        title: "Activity updated successfully",
        icon: icons.check,
        color: "success"
      })
    }
  } catch (e) {
    console.error(e)

    toast.add({
      title: "Error updating activity",
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(isUpdating, false)
  }
}
</script>

<template>
  <dashboard-subpanel
    title="Entries"
    :icon="COUNTRY_DRAWS.includes(id) ? ICONS.globe : ICONS.player"
  >
    <template #right>
      <dev-only>
        <edition-entries-activity
          v-if="tournamentStore.tours.includes('ATP')"
          @refresh="refresh++"
        />

        <u-button
          v-if="!COUNTRY_DRAWS.includes(id)"
          @click="updateActivityInfo"
          :icon="isUpdating ? ICONS.uploading : icons.upload"
          color="warning"
        />

        <edition-entries-country-create
          v-if="COUNTRY_DRAWS.includes(id)"
          @refresh="refresh++"
        />

        <edition-entries-country-player-create
          v-if="COUNTRY_DRAWS.includes(id)"
          @refresh="refresh++"
        />

        <edition-entries-create @refresh="refresh++" />
      </dev-only>

      <u-radio-group
        v-model="viewType"
        :items="['By Player', 'By Team']"
        orientation="horizontal"
        class="ml-2"
      />
    </template>

    <edition-entries-players
      v-if="viewType === 'By Player'"
      :refresh
    />

    <template v-else>
      <edition-entries-country-teams
        v-if="COUNTRY_DRAWS.includes(id)"
        :refresh
      />

      <edition-entries-teams v-else />
    </template>
  </dashboard-subpanel>
</template>
