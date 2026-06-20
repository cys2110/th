<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title: string
  }>(),
  { icon: "line-md:alert-twotone" }
)

defineEmits<{ refresh: [] }>()

const { ui } = useAppConfig()
</script>

<template>
  <u-empty
    :icon
    :title
    description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
  >
    <template #actions>
      <u-button
        label="Refresh"
        :icon="ui.icons.reload"
        @click="$emit('refresh')"
      />
    </template>
  </u-empty>
</template>
