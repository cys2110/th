<script setup lang="ts">
const { events, status, selection, tour, firstName, lastName } = defineProps<{
  events: TitlesAndFinalsInterface[]
  status: APIStatusType
  tour: TourType
  firstName: string
  lastName: string
  selection: ("Titles" | "Finals")[]
}>()
const { icons } = useAppConfig()
</script>

<template>
  <div
    v-if="events.length"
    class="scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent max-h-200 overflow-y-auto flex justify-center"
  >
    <u-timeline
      :items="events"
      :color="tour === 'ATP' ? 'atp' : 'wta'"
      :default-value="events.length - 1"
      :ui="{
        item: 'even:flex-row-reverse even:-translate-x-[calc(100%-2rem)] even:text-right'
      }"
    >
      <template #title="{ item }">
        <u-link
          :to="{ name: 'tournament', params: { id: item.tournament.id, name: kebabCase(item.tournament.name) } }"
          class="hover-link"
        >
          {{ item.tournament.name }}
        </u-link>
      </template>
      <template #date="{ item }">
        <u-link
          :to="{ name: 'event', params: { id: item.tournament.id, name: kebabCase(item.tournament.name), year: item.year, eid: item.id } }"
          class="hover-link"
        >
          {{
            item.end_date ? useDateFormat(getDate(item.end_date), "DD MMMM YYYY")
            : tour == "ATP" ?
              item.atp_end_date ?
                useDateFormat(getDate(item.atp_end_date), "DD MMMM YYYY")
              : useDateFormat(getDate(item.men_end_date!), "DD MMMM YYYY")
            : item.wta_end_date ? useDateFormat(getDate(item.wta_end_date), "DD MMMM YYYY")
            : useDateFormat(getDate(item.women_end_date!), "DD MMMM YYYY")
          }}
        </u-link>
      </template>
      <template #description="{ item }">
        <div class="inline-flex items-center text-sm gap-1 w-fit">
          <u-link
            v-if="[item.category, item.atp_category, item.men_category, item.wta_category, item.women_category].length > 0"
            :to="{
              name: 'category',
              params: {
                id: kebabCase(
                  item.category ??
                    ((tour === 'ATP' ? (item.atp_category ?? item.men_category) : (item.wta_category ?? item.women_category)) as string)
                )
              }
            }"
            class="hover-link"
          >
            {{ item.category ?? (tour === "ATP" ? (item.atp_category ?? item.men_category) : (item.wta_category ?? item.women_category ?? "—")) }}
          </u-link>
          <u-separator
            v-if="[item.category, item.atp_category, item.men_category, item.wta_category, item.women_category].length > 0"
            class="h-4"
            orientation="vertical"
          />
          <u-link
            :to="{ name: 'surface', params: { id: kebabCase(item.surface) } }"
            class="hover-link"
          >
            {{ item.surface }}
          </u-link>
        </div>
      </template>
    </u-timeline>
  </div>
  <div
    v-else-if="status === 'pending'"
    class="mx-auto w-fit flex flex-col"
  >
    <loading-base
      v-for="_ in 10"
      :key="_"
    />
  </div>
  <error-message
    v-else
    :icon="icons.noTournament"
    :message="`No ${selection.length === 2 ? 'titles or finals' : selection[0]?.toLowerCase()} found for ${firstName} ${lastName}`"
  />
</template>
