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

const state = ref<FormType>({
  id: `${edId}-Country`,
  rounds: [],
  groups: []
})
</script>

<template>
  <u-modal title="Create Rounds">
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
        label="Cancel"
        :icon="icons.error"
        @click="close"
        block
        color="error"
      />
    </template>
  </u-modal>
</template>
