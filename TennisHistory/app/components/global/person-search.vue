<script setup lang="ts">
import { ICONS } from "#imports"

const props = defineProps<{ multiple: boolean }>()

const { people, pending, fetchPeople, searchTerm } = usePersonSearch()

type People = (typeof people.value)[number]

const modelValue = defineModel<People>()
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    v-model:search-term="searchTerm"
    :loading="pending"
    clear
    ignore-filter
    :multiple
    placeholder="Person"
    :items="people"
    class="w-full"
    label-key="full_name"
  >
    <template
      v-if="!multiple"
      #leading="{ modelValue: selectedPerson }"
    >
      <u-icon
        v-if="!Array.isArray(selectedPerson)"
        :name="selectedPerson?.icon || ICONS.racquet"
      />
    </template>

    <template #content-bottom>
      <person-create @refresh="fetchPeople" />
    </template>
  </u-input-menu>
</template>
