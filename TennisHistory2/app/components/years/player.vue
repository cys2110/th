<script setup lang="ts">
const props = defineProps<{
  label: string
  placeholder?: string
  players: Array<Pick<PlayerInterface, "id" | "first_name" | "last_name" | "country" | "tour">>
  year: number
}>()

const {
  ui: { icons, colors }
} = useAppConfig()
</script>

<template>
  <u-collapsible>
    <u-button
      class="group my-2"
      :label="`Players ${placeholder || `who ${label}`} in ${year}`"
      color="neutral"
      block
      :trailing-icon="icons.chevronDown"
      :ui="{
        trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
        base: 'cursor-pointer'
      }"
    />

    <template #content>
      <u-page-grid v-if="players.length">
        <u-page-card
          v-for="player in players"
          :key="player.id"
          :title="`${player.first_name} ${player.last_name}`"
          :to="{
            name: 'player',
            params: {
              id: player.id,
              name: kebabCase(`${player.first_name} ${player.last_name}`)
            }
          }"
          highlight
          :highlight-color="<keyof typeof colors>player.tour"
        >
          <template #leading>
            <u-icon :name="getFlagCode(player.country!)" />
          </template>
        </u-page-card>
      </u-page-grid>

      <empty
        v-else
        :message="`No players ${placeholder || `who ${label}`} in ${year}`"
        class="m-5"
      />
    </template>
  </u-collapsible>
</template>
