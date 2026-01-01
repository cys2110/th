<script setup lang="ts">


const props = defineProps<{
  player: BasePlayerType
}>()

const {
  ui: { colors }
} = useAppConfig()

const currentYear = new Date().getFullYear()

const activeStatus = computed(() => {
  if (props.player.max_year === currentYear) {
    return true
  } else {
    return false
  }
})

const activeText = computed(() => {
  let text = "—"

  if (props.player.min_year) {
    text = `${props.player.min_year}`

    if (props.player.max_year === currentYear) {
      text += " - present"
    } else if (props.player.max_year && props.player.max_year !== props.player.min_year) {
      text += ` - ${props.player.max_year}`
    }
  }

  return text
})
</script>

<template>
  <u-chip
    :color="activeStatus ? 'success' : 'error'"
    size="3xl"
    class="w-full"
  >
    <u-page-card
      :title="`${player.first_name} ${player.last_name}`"
      highlight
      :highlight-color="(player.tour as keyof typeof colors)"
      :to="{ name: 'player', params: { id: player.id, name: player.first_name ? kebabCase(`${player.first_name}-${player.last_name}`) : '—' } }"
      :ui="{
        root: 'flex-1',
        body: 'w-full',
        leading: 'flex justify-between items-center w-full',
        description: '*:first:mb-1 text-sm *:not-first:ml-3',
        footer: 'text-sm w-full text-muted'
      }"
    >
      <template #leading>
        <countries-link
          v-if="player.country"
          :country="player.country"
          icon-only
        />

        <u-badge
          :color="(player.tour as keyof typeof colors)"
          :label="player.tour"
        />
      </template>

      <template
        #description
        v-if="player.coaches.length"
      >
        <div>Coaches:</div>
        <div
          v-for="coach in player.coaches"
          :key="coach.id"
        >
          {{ coach.first_name }} {{ coach.last_name }} <span v-if="coach.years"> ({{ coach.years }}) </span>
        </div>
      </template>

      <template #footer> Active: {{ activeText }} </template>
    </u-page-card>
  </u-chip>
</template>
