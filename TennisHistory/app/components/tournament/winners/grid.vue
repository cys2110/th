<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

const props = defineProps<{
  editions: BaseEditionType[]
  status: AsyncDataRequestStatus
}>()

const tournamentStore = useTournamentStore()

const consolidatedEditions = computed<Record<string, BaseEditionType[]>>(() => groupBy(props.editions, "id"))

const editionIds = computed(() => Object.keys(consolidatedEditions.value))
</script>

<template>
  <div
    v-if="editions.length || status === 'pending'"
    class="scrollbar p-5"
  >
    <u-page-columns>
      <tournament-winners-card
        v-if="editionIds.length"
        v-for="editionId in editionIds"
        :key="editionId"
        :editions="consolidatedEditions[editionId] || []"
      />
      <tournament-winners-loading
        v-else
        v-for="_ in 6"
        :key="_"
      />
    </u-page-columns>
  </div>

  <empty
    v-else
    :message="`No editions have been played for ${tournamentStore.name}.`"
    :icon="ICONS.calendarOff"
    class="m-5"
  >
    <dev-only>
      <editions-update />
    </dev-only>
  </empty>
</template>
