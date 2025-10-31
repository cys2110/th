<script setup lang="ts">
const { tournaments } = defineProps<{
  label: string
  tournaments: Pick<TournamentInterface, "id" | "name">[] | undefined
  year: string
}>()
const appConfig = useAppConfig()
</script>

<template>
  <u-collapsible>
    <u-button
      class="group my-2"
      :label="`Tournaments ${label}`"
      color="neutral"
      :ui="{
        trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
        base: 'cursor-pointer'
      }"
      block
      :trailing-icon="appConfig.ui.icons.chevronDown"
    />
    <template #content>
      <div
        class="flex flex-col gap-2 max-h-100 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent scrollbar-thumb-rounded-full"
      >
        <base-link
          v-if="tournaments?.length"
          v-for="tournament in tournaments"
          :key="tournament.id"
          type="tournament"
          :tournament
          class="text-sm w-fit"
        />
        <span
          v-else
          class="text-sm text-center"
        >
          No tournaments {{ label }} in {{ year }}
        </span>
      </div>
    </template>
  </u-collapsible>
</template>
