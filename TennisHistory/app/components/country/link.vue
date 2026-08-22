<script setup lang="ts">
import { kebabCase } from "#imports"
import { type Tables } from "~/types/database.types"

type CountryType = Tables<{ schema: "tennis" }, "country">

withDefaults(
  defineProps<{
    country: CountryType
    iconOnly?: boolean
  }>(),
  { iconOnly: false }
)
</script>

<template>
  <u-link
    :to="{ name: 'country', params: { id: country.id, name: kebabCase(country.name) } }"
    class="w-fit flex items-center gap-1.5"
  >
    <u-icon
      :name="country.icon"
      class="rounded-md size-5"
    />

    <span
      v-if="!iconOnly"
      class="hover-link primary-link w-fit"
    >
      {{ country.name }}
    </span>
  </u-link>
</template>
