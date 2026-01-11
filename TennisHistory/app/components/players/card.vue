<script setup lang="ts">
const { player } = defineProps<{
  player: BasePlayerType
}>()

const {
  ui: { colors }
} = useAppConfig()

const currentYear = new Date().getFullYear()

const activeStatus = computed(() => {
  if (player.max_year === currentYear) {
    return "Active"
  } else {
    return "Inactive"
  }
})

const activeText = computed(() => {
  let text = "—"

  if (player.min_year) {
    text = `${player.min_year}`

    if (player.max_year === currentYear) {
      text += " - present"
    } else if (player.max_year && player.max_year !== player.min_year) {
      text += ` - ${player.max_year}`
    }
  }

  return text
})
</script>

<template>
  <u-page-card
    :title="`${player.first_name} ${player.last_name}`"
    highlight
    :highlight-color="(player.tour as keyof typeof colors)"
    :to="{ name: 'player', params: { id: player.id, name: player.first_name ? kebabCase(`${player.first_name}-${player.last_name}`) : '—' } }"
    :ui="{
      body: 'w-full',
      leading: 'flex justify-between items-center w-full',
      description: '*:first:mb-1 text-sm *:not-first:ml-3',
      footer: 'text-sm w-full text-muted'
    }"
  >
    <template #leading>
      <div>
        <country-link
          v-if="player.country"
          :country="player.country"
          icon-only
        />
      </div>

      <div class="*:mx-0.5">
        <u-badge
          :color="(player.tour as keyof typeof colors)"
          :label="player.tour"
        />

        <u-badge
          :color="activeStatus"
          :label="activeStatus"
        />
      </div>
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
</template>
