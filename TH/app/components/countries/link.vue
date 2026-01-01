<script setup lang="ts">
/**
 * Reusable component to display a link to a country's page with its flag and name.
 * @prop country - The country object containing its details.
 * @prop iconOnly - Whether to display only the flag icon without the country name.
 */

withDefaults(
  defineProps<{
    country: CountryType
    iconOnly?: boolean
  }>(),
  {
    iconOnly: false
  }
)
</script>

<template>
  <u-link
    :to="{ name: 'country', params: { id: country.id, name: kebabCase(country.name!) } }"
    class="w-fit flex items-center gap-1"
  >
    <u-icon :name="getFlagCode(country)" />

    <span
      v-if="!iconOnly"
      class="hover-link default-link w-fit"
    >
      {{ country.name }}
    </span>
  </u-link>
</template>
