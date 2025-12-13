<script setup lang="ts">
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
    title="Entries"
    :icon="ICONS.player"
  >
    <template #right>
      <dev-only>
        <editions-entries-activity
          v-if="tours.includes('ATP')"
          v-model="refresh"
        />

        <u-button
          v-else
          @click="updateActivityInfo"
          :icon="updating ? ICONS.uploading : icons.upload"
        />

        <editions-entries-update
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

    <editions-entries-players
      v-if="viewType === 'By Player'"
      v-model:refresh-count="refresh"
    />

    <editions-entries-teams v-else />
  </dashboard-subpanel>
</template>
