<script setup lang="ts">
defineProps<{
  round: TournamentLowestRankedType[]
}>()

const {
  params: { id, name }
} = useRoute("tournament")
const {
  ui: { colors }
} = useAppConfig()
</script>

<template>
  <u-page-card
    highlight
    :title="round[0]?.round"
    :ui="{ body: 'w-full' }"
  >
    <template #description>
      <div
        v-for="player in round"
        :key="player.id"
        class="flex flex-col gap-1"
      >
        <u-badge
          :label="player.tour"
          :color="(player.tour as keyof typeof colors)"
          class="w-full"
        />
        <div class="flex items-center gap-4">
          <u-link
            :to="{
              name: 'edition',
              params: {
                id,
                name,
                year: player.year,
                edId: player.edId
              }
            }"
            class="hover-link default-link w-fit"
          >
            {{ player.year }}
          </u-link>
          <div class="flex items-center">
            <player-link
              class="col-span-8"
              :player
            />
            <span class="ml-2">({{ player.rank }})</span>
          </div>
        </div>
      </div>
    </template>
  </u-page-card>
</template>
