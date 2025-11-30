<script setup lang="ts">
const {
  params: { tour, edId }
} = useRoute("event")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

const viewType = ref("By Player")
const refresh = ref(0)
const updating = ref(false)

const updateActivityInfo = async () => {
  set(updating, true)

  const response = await $fetch("/api/players/activity/update", {
    query: { id: edId }
  })
  if ((response as any).ok) {
    toast.add({
      title: "Activity updated successfully",
      icon: icons.check,
      color: "success"
    })
    refresh.value++
  } else {
    toast.add({
      title: "Error updating activity",
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
    id="entries"
    title="Entries"
    :icon="ICONS.player"
  >
    <template #right>
      <dev-only>
        <events-entries-activity
          v-if="tour === 'ATP'"
          v-model="refresh"
        />
        <u-button
          v-else
          @click="updateActivityInfo"
          :icon="updating ? ICONS.uploading : icons.upload"
        />
        <events-entries-update
          v-model="refresh"
          class="mr-1"
          icon-only
        />
      </dev-only>
      <u-radio-group
        v-model="viewType"
        :items="['By Player', 'By Team']"
        orientation="horizontal"
      />
    </template>

    <events-entries-players
      v-if="viewType === 'By Player'"
      v-model:refresh-count="refresh"
    />

    <events-entries-teams v-else />
  </dashboard-subpanel>
</template>
