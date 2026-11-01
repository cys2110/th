<script setup lang="ts">
import { kebabCase } from "#imports"

withDefaults(
  defineProps<{
    country: CountryType
    size?: number
    iconOnly?: boolean
  }>(),
  { iconOnly: false, size: 5 }
)
</script>

<template>
  <u-link
    :to="{ name: 'country', params: { id: country.id, name: kebabCase(country.name) } }"
    class="w-fit flex items-center gap-1.5"
  >
    <u-icon
      :name="country.icon"
      class="rounded-md"
      :class="`size-${size}`"
    />

    <span
      v-if="!iconOnly"
      class="hover-link primary-link w-fit"
    >
      {{ country.name }}
    </span>
  </u-link>
</template>
