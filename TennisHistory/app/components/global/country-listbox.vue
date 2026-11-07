<script setup lang="ts">
const { countries, pending } = useCountryList()

const modelValue = defineModel<string>()
</script>

<template>
  <u-listbox
    v-model="modelValue"
    :items="countries"
    :loading="pending"
    label-key="name"
    value-key="id"
    filter
  />
</template>
