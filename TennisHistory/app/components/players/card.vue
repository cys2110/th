<script setup lang="ts">
defineProps<{
  player: BasePlayerType
}>()

const {
  ui: { colors }
} = useAppConfig()

const currentYear = new Date().getFullYear()
</script>

<template>
  <u-page-card
    :title="`${player.first_name} ${player.last_name}`"
    highlight
    :highlight-color="(player.tour as keyof typeof colors)"
    :to="{ name: 'player', params: { id: player.id, name: player.first_name ? kebabCase(`${player.first_name}-${player.last_name}`) : '—' } }"
    :ui="{ body: 'w-full', leading: 'flex justify-between items-center w-full', footer: 'text-sm w-full' }"
  >
    <template #leading>
      <div>
        <countries-link
          v-if="player.country"
          :country="player.country"
          icon-only
        />
      </div>

      <div class="flex items-center gap-2">
        <u-badge
          :color="(player.tour as keyof typeof colors)"
          :label="player.tour"
        />

        <u-badge
          :color="player.max_year === currentYear ? 'Active' : 'Inactive'"
          :label="player.max_year === currentYear ? 'Active' : 'Inactive'"
        />
      </div>
    </template>

    <template
      #description
      v-if="player.coaches.length"
    >
      <div class="mb-1 text-sm">Coaches:</div>
      <div
        v-for="coach in player.coaches"
        :key="coach.id"
        class="text-sm ml-3"
      >
        {{ coach.first_name }} {{ coach.last_name }} <span v-if="coach.years"> ({{ coach.years }}) </span>
      </div>
    </template>

    <template #footer>
      Active:
      {{
        player.min_year && player.min_year === player.max_year
          ? player.min_year
          : player.min_year && player.max_year === currentYear
          ? `${player.min_year} - present`
          : player.min_year
          ? `${player.min_year} - ${player.max_year}`
          : "—"
      }}
    </template>
  </u-page-card>
</template>
