<script setup lang="ts">
import { ICONS } from "#imports"
import { type Tables } from "~/types/database.types"

const modelValue = defineModel<Tables<{ schema: "tennis" }, "country">>()

const { ui } = useAppConfig()

const { countries, pending, fetchCountries } = useCountryList()
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    :items="countries"
    :loading="pending"
    label-key="name"
    placeholder="Country"
    class="w-full"
  >
    <template #leading="{ modelValue }">
      <u-icon :name="modelValue?.icon || ICONS.globe" />
    </template>

    <template #content-bottom>
      <u-button
        :icon="ui.icons.reload"
        label="Refresh"
        block
        @click="fetchCountries()"
      />
    </template>
  </u-input-menu>
</template>
