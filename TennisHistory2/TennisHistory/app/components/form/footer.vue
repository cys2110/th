<script setup lang="ts">
withDefaults(
  defineProps<{
    form: string
    loading: boolean
    label?: string
    icon?: string
    loadingIcon?: string
  }>(),
  { label: "Submit", icon: "line-md:uploading", loadingIcon: ICONS.uploading }
)

defineEmits<{
  reset: []
  close: []
}>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-button
    :label
    color="success"
    block
    :icon
    :loading
    :loading-icon
    type="submit"
    :form
  />

  <u-button
    label="Reset"
    color="warning"
    block
    :icon="icons.reload"
    @click="$emit('reset')"
  />

  <u-button
    label="Cancel"
    color="error"
    block
    :icon="icons.close"
    @click="$emit('close')"
  />
</template>
