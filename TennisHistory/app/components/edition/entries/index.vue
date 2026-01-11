<script setup lang="ts">
const {
  params: { id, edId }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const tournamentStore = useTournamentStore()

const viewType = ref("By Player")
const refresh = ref(0)
const updating = ref(false)

const updateActivityInfo = async () => {
  set(updating, true)

  try {
    const response = await $fetch("/api/player/activity/update", {
      query: { id: edId }
    })
    if (response?.success) {
      toast.add({
        title: "Activity updated successfully",
        icon: icons.check,
        color: "success"
      })
      refresh.value++
    } else {
      toast.add({
        title: "Error updating activity",
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    console.error(e)

    toast.add({
      title: "Error updating activity",
      icon: icons.error,
      color: "error"
    })
  }

  set(updating, false)
}
</script>

<template>
  <dashboard-subpanel
    title="Entries"
    :icon="ICONS.player"
  >
    <template #right>
      <dev-only>
        <edition-entries-activity
          v-if="tournamentStore.tours.includes('ATP')"
          v-model="refresh"
        />

        <u-button
          v-if="!COUNTRY_DRAWS.includes(id)"
          @click="updateActivityInfo"
          :icon="updating ? ICONS.uploading : icons.upload"
          color="Doubles"
        />

        <edition-entries-country-update
          v-if="COUNTRY_DRAWS.includes(id)"
          v-model="refresh"
          icon-only
        />

        <edition-entries-update
          v-model="refresh"
          icon-only
        />
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
      v-model:refresh-count="refresh"
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
