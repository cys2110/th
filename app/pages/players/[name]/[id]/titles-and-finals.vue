<script setup lang="ts">
import { UBadge, ULink } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"

definePageMeta({ name: "titles-and-finals" })

const {
  params: { id }
} = useRoute("titles-and-finals")
const {
  ui: { icons }
} = useAppConfig()

const viewMode = ref(true)
const selection = ref(true)
const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

const { data: events, status } = await useFetch("/api/players/titles-and-finals", {
  query: { id, selection },
  default: () => []
})

const columns = computed<TableColumn<TitlesAndFinalsType>[]>(() => [
  { accessorKey: "date", header: "Date", cell: ({ row }) => useDateFormat(row.original.date, "DD MMMM YYYY").value },
  {
    accessorKey: "tournament.name",
    header: "Tournament",
    cell: ({ row }) =>
      h(
        ULink,
        {
          class: "hover-link default-link",
          to: { name: "tournament", params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }
        },
        () => row.original.tournament.name
      )
  },
  { accessorKey: "type", header: "S/D", cell: ({ row }) => h(UBadge, { label: row.original.type, color: row.original.type }) },
  { accessorKey: "level", header: "Level", cell: ({ row }) => h(UBadge, { label: row.original.level, color: row.original.level }) },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "surface.id", header: "Surface" }
])

const handleSelect = async (e: Event, row: TableRow<TitlesAndFinalsType>) => {
  await navigateTo({
    name: "event",
    params: {
      id: row.original.tournament.id,
      name: kebabCase(row.original.tournament.name),
      edId: row.original.id,
      year: row.original.year,
      tour: row.original.tour
    }
  })
}
</script>

<template>
  <players-wrapper>
    <template #header-links>
      <u-tooltip :text="viewMode ? 'Cards' : 'Table'">
        <div>
          <u-switch
            v-model="viewMode"
            :checked-icon="ICONS.cards"
            :unchecked-icon="ICONS.table"
          />
        </div>
      </u-tooltip>
      <u-tooltip :text="selection ? 'Titles' : 'Finals'">
        <div>
          <u-switch
            v-model="selection"
            :checked-icon="ICONS.one"
            :unchecked-icon="ICONS.noTournament"
          />
        </div>
      </u-tooltip>
    </template>

    <template #default="{ firstName, lastName }">
      <define-empty-template>
        <empty
          :icon="ICONS.noTournament"
          :message="`${firstName} ${lastName} has not ${selection ? 'won any titles' : 'not player any finals'}.`"
          class="mx-2"
        />
      </define-empty-template>

      <template v-if="viewMode">
        <div
          v-if="events.length"
          class="scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent max-h-200 overflow-y-auto flex justify-center"
        >
          <u-timeline
            :items="events"
            :default-value="events.length - 1"
            :ui="{
              item: 'even:flex-row-reverse even:-translate-x-[calc(100%-2rem)] even:text-right'
            }"
          >
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
                  name: 'event',
                  params: { id: item.tournament.id, name: kebabCase(item.tournament.name), edId: item.id, year: item.year, tour: item.tour }
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

        <reuse-empty-template v-else />
      </template>

      <u-table
        v-else
        ref="table"
        :data="events"
        :columns
        :loading="['idle', 'pending'].includes(status)"
        sticky
        @select="handleSelect"
        :ui="{ root: 'w-fit min-w-1/3 mx-auto', tbody: '[&>tr]:cursor-pointer', td: 'empty:p-0' }"
      >
        <template #loading>
          <u-icon
            :name="icons.loading"
            class="size-8"
          />
        </template>

        <template #empty>
          <reuse-empty-template />
        </template>
      </u-table>
    </template>
  </players-wrapper>
</template>
