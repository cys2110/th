<script setup lang="ts">
const props = defineProps<{
  player: BasePlayerType
}>()

const {
  ui: { colors }
} = useAppConfig()

const currentYear = new Date().getFullYear()

const activeStatus = computed(() => {
  if (props.player.max_year === currentYear) return "Active"

  return "Inactive"
})
</script>

<template>
  <u-chip
    :color="activeStatus"
    size="3xl"
    class="w-full"
  >
    <u-page-card
      :title="`${player.first_name} ${player.last_name}`"
      highlight
      :highlight-color="<keyof typeof colors>player.tour"
      :to="{
        name: 'player',
        params: {
          id: player.id,
          name: player.last_name ? kebabCase(`${player.first_name}-${player.last_name}`) : '—'
        }
      }"
      :ui="{
        root: 'flex-1',
        body: 'w-full',
        leading: 'flex justify-between items-center w-full',
        description: '*:first:mb-1 text-sm *:not-first:ml-3',
        footer: 'text-sm w-full text-muted'
      }"
    >
      <template #leading>
        <u-icon
          v-if="player.country"
          :name="getFlagCode(player.country)"
        />

        <u-badge
          :color="<keyof typeof colors>player.tour"
          :label="player.tour"
        />
      </template>

      <template
        #description
        v-if="player.coaches?.length"
      >
        <div>Coaches:</div>
        <div
          v-for="coach in player.coaches"
          :key="coach.id"
        >
          {{ coach.first_name }} {{ coach.last_name }}
          <span v-if="coach.years"> ({{ coach.years }}) </span>
        </div>
      </template>

      <template #footer>
        <span>{{ player.min_year }}</span>
        <span v-if="player.max_year === currentYear"> - present</span>
        <span v-else-if="player.max_year !== player.min_year"> - {{ player.max_year }}</span>
      </template>
    </u-page-card>
  </u-chip>
</template>
