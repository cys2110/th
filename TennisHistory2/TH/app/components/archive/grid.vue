<script setup lang="ts">
import { ICONS } from "#imports"

const props = defineProps<{
  editions: Array<ArchiveInterface>
  pending: boolean
}>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("results-archive")
</script>

<template>
  <u-page-grid
    v-if="editions.length || pending"
    class="2xl:grid-cols-4"
  >
    <archive-card
      v-for="edition in editions"
      :key="edition.id"
      :edition
    />

    <loading-card
      v-if="pending"
      v-for="_ in 6"
      :key="_"
    />
  </u-page-grid>

  <empty
    v-else
    :icon="ICONS.calendarOff"
    :title="`There were no tournaments played in ${route.query.year}`"
    @refresh="$emit('refresh')"
  />
</template>
