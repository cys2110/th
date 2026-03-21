<script setup lang="ts">
defineProps<{
  form: string
  isUploading: boolean
}>()

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
    label="Save"
    color="success"
    block
    :icon="icons.upload"
    :loading="isUploading"
    :loading-icon="ICONS.uploading"
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
