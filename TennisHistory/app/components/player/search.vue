<script setup lang="ts">
import { ICONS } from "#imports"

const props = defineProps<{ multiple: boolean }>()

const { players, pending, fetchPlayers, searchTerm } = usePlayerSearch()

type Players = (typeof players.value)[number]

const modelValue = defineModel<Players>()
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    v-model:search-term="searchTerm"
    :loading="pending"
    clear
    ignore-filter
    :multiple
    placeholder="Player"
    :items="players"
    class="w-full"
    label-key="full_name"
  >
    <template
      v-if="!multiple"
      #leading="{ modelValue: selectedPlayer }"
    >
      <u-icon
        v-if="!Array.isArray(selectedPlayer)"
        :name="selectedPlayer?.icon || ICONS.player"
      />
    </template>

    <template #content-bottom>
      <player-create
        @refresh="fetchPlayers"
        :forward="false"
      />
    </template>
  </u-input-menu>
</template>
