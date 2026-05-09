<script setup lang="ts">
const props = defineProps<{
  player: PlayersItemType
}>()

const {
  ui: { colors }
} = useAppConfig()

const currentYear = new Date().getFullYear()

const activeStatus = computed(() => {
  if (props.player.retired && props.player.retired < currentYear) return "Inactive"

  return "Active"
})
</script>

<template>
  <u-chip
    :color="activeStatus"
    size="3xl"
    class="w-full"
  >
    <u-page-card
      :icon="player.country ? getFlagCode(player.country) : undefined"
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
        root: 'flex-1 h-full',
        body: 'w-full',
        leading: 'flex justify-between items-center w-full',
        footer: 'text-sm w-full text-muted'
      }"
    >
      <template #footer>
        <span v-if="player.turned_pro">{{ player.turned_pro }}</span>
        <span v-if="!player.retired || player.retired >= currentYear"> - present</span>
        <span v-else-if="player.retired && player.turned_pro !== player.retired"> - {{ player.retired }}</span>
      </template>
    </u-page-card>
  </u-chip>
</template>
