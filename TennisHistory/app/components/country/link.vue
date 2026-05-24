<script setup lang="ts">
withDefaults(
  defineProps<{
    country: CountryInterface
    iconOnly?: boolean
  }>(),
  { iconOnly: false }
)
</script>

<template>
  <u-link
    :to="{ name: 'country', params: { id: country.id, name: kebabCase(country.name!) } }"
    class="w-fit flex items-center gap-1.5"
  >
    <u-icon
      :name="getFlagCode(country)"
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
