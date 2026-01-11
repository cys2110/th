<script setup lang="ts">
withDefaults(
  defineProps<{
    disabled?: boolean
    items: OptionType[]
  }>(),
  {
    disabled: false
  }
)

const tournaments = defineModel<OptionType[]>()
</script>

<template>
  <form-input-menu
    v-model="tournaments"
    placeholder="Tournaments"
    :items="items"
    :icon="ICONS.trophy"
    :disabled="disabled"
    multiple
  />
</template>
