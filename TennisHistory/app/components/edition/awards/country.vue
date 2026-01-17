<script setup lang="ts">
const {
  params: { edId }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()

interface FormType {
  id: string
  rounds: RoundEnumType[]
  groups: string[]
}

const uploading = ref(false)
const toast = useToast()
const open = ref(false)

const state = ref<FormType>({
  id: `${edId}-Country`,
  rounds: [],
  groups: []
})

const onSubmit = async () => {
  set(uploading, true)

  try {
    const response = await $fetch("/api/edition/awards/country", {
      method: "POST",
      body: state.value
    })

    if (response.success) {
      toast.add({
        title: "Rounds successfully created",
        icon: icons.success,
        color: "success"
      })

      set(open, false)
    } else {
      toast.add({
        title: "Error creating rounds",
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    console.error(e)

    toast.add({
      title: "Error creating rounds",
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(uploading, false)
  }
}
</script>

<template>
  <u-modal
    title="Create Rounds"
    v-model:open="open"
  >
    <u-button
      :icon="icons.plus"
      label="Create Rounds"
      color="Doubles"
      block
    />

    <template #body>
      <div class="grid grid-cols-2 gap-4">
        <u-form-field label="Select rounds to create">
          <u-checkbox-group
            v-model="state.rounds"
            :items="['Final', 'Semifinals', 'Quarterfinals', 'Group stage']"
          />
        </u-form-field>

        <u-form-field
          v-if="state.rounds.includes('Group stage')"
          label="Enter group names"
          description="The word 'Group' will automatically be added at the start of each group name."
        >
          <form-input-tags
            v-model="state.groups"
            placeholder="e.g., 'A', 'B', 'C'"
          />
        </u-form-field>
      </div>
    </template>

    <template #footer="{ close }">
      <u-button
        label="Save"
        :icon="uploading ? ICONS.uploading : icons.upload"
        @click="onSubmit"
        block
        color="success"
      />
      <u-button
        label="Cancel"
        :icon="icons.error"
        @click="close"
        block
        color="error"
      />
    </template>
  </u-modal>
</template>
