<script setup lang="ts">
withDefaults(
  defineProps<{
    form: string
    loading: boolean
    label?: string
    icon?: string
    loadingIcon?: string
  }>(),
  { label: "Save", icon: ICONS.save, loadingIcon: ICONS.uploading }
)

defineEmits<{
  reset: []
  close: []
}>()

const { ui } = useAppConfig()
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
    :icon="ui.icons.reload"
    @click="$emit('reset')"
  />

  <u-button
    label="Cancel"
    color="error"
    block
    :icon="ui.icons.close"
    @click="$emit('close')"
  />
</template>
