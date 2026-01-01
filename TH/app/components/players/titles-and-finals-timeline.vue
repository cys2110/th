<script setup lang="ts">


const props = defineProps<{
  events: TitlesAndFinalsType[]
}>()

const timelineEvents = computed(() =>
  props.events.map(event => ({
    ...event,
    won: event.title,
    title: event.tournament.name
  }))
)
</script>

<template>
  <div class="scrollbar flex justify-center">
    <u-timeline
      :items="timelineEvents"
      :default-value="events.length - 1"
      :ui="{
        title: 'mb-2',
        item: 'even:flex-row-reverse even:-translate-x-[calc(100%-2rem)] even:text-right'
      }"
    >
      <template #indicator="{ item }">
        <u-icon
          v-if="item.won"
          :name="ICONS.trophy"
          class="text-xl"
        />
      </template>

      <template #title="{ item }">
        <u-link
          :to="{ name: 'tournament', params: { id: item.tournament.id, name: kebabCase(item.tournament.name) } }"
          class="hover-link default-link"
        >
          {{ item.tournament.name }}
        </u-link>
      </template>

      <template #date="{ item }">
        <u-link
          :to="{
            name: 'edition',
            params: { id: item.tournament.id, name: kebabCase(item.tournament.name), edId: item.id, year: item.year }
          }"
          class="hover-link default-link"
        >
          {{ useDateFormat(item.date, "DD MMMM YYYY") }}
        </u-link>
      </template>

      <template #description="{ item }">
        <div class="flex flex-col gap-1">
          <div class="inline-flex items-center gap-1">
            <u-badge
              :label="item.type"
              :color="item.type"
              class="justify-center w-full"
            />
            <u-badge
              :label="item.level"
              :color="item.level"
              class="justify-center w-full"
            />
          </div>
          <div class="inline-flex justify-between items-center text-sm gap-1 w-full">
            <span v-if="item.category">
              {{ item.category }}
            </span>
            <u-separator
              v-if="item.category"
              class="h-4"
              orientation="vertical"
            />
            <span>
              {{ item.surface.id }}
            </span>
          </div>
        </div>
      </template>
    </u-timeline>
  </div>
</template>
