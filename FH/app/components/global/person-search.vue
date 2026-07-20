<script setup lang="ts">
import { ICONS } from "#imports"

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
    placeholder="People"
    :items="people"
    class="w-full"
    label-key="full_name"
  >
    <template #leading="{ modelValue: selectedPerson }">
      <u-icon :name="selectedPerson?.country?.icon || ICONS.football" />
    </template>

    <template #item-leading="{ item }">
      <u-icon
        v-if="item.country"
        :name="item.country.icon"
      />
    </template>

    <template #content-bottom>
      <person-create @refresh="fetchPeople" />
    </template>
  </u-input-menu>
</template>
