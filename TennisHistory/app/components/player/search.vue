<script setup lang="ts">
withDefaults(defineProps<{ multiple?: boolean }>(), { multiple: false })

const modelValue = defineModel<any>()

const { results, pending, searchTerm, fetchSearchResults } = usePlayerSearch()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    v-model:search-term="searchTerm"
    :loading="pending"
    clear
    placeholder="Select player"
    :icon="ICONS.player"
    :items="results"
    :multiple
    label-key="name"
    :ui="{
      root: 'w-full',
      base: modelValue && Array.isArray(modelValue) ? 'pl-10' : '',
      itemLabel: modelValue && Array.isArray(modelValue) ? 'ml-8' : 'ml-4'
    }"
  >
    <template #leading="{ modelValue }">
      <u-icon
        v-if="modelValue && Array.isArray(modelValue)"
        v-for="(player, index) in modelValue"
        :key="player.id"
        :name="player.icon"
        class="absolute size-4 rounded-sm"
        :class="{ 'z-10 left-5': index === 1 }"
      />

      <u-icon
        v-else
        :name="modelValue?.icon || ICONS.player"
      />
    </template>

    <template #content-bottom>
      <u-button
        :icon="icons.reload"
        label="Refresh"
        block
        @click="fetchSearchResults()"
      />
    </template>
  </u-input-menu>
</template>
