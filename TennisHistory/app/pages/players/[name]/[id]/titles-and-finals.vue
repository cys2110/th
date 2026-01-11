<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

definePageMeta({ name: "titles-and-finals" })

const {
  params: { id }
} = useRoute("titles-and-finals")
const router = useRouter()

const viewMode = ref(true)
const selection = ref(true)
const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

const playerName = useState("playerName")

// const { data: events, status } = await useFetch("/api/players/titles-and-finals", {
//   query: { id, selection },
//   default: () => []
// })

// const handleSelect = (e: Event, row: TableRow<TitlesAndFinalsType>) => {
//   router.push({
//     name: "edition",
//     params: {
//       id: row.original.tournament.id,
//       name: kebabCase(row.original.tournament.name),
//       edId: row.original.id,
//       year: row.original.year
//     }
//   })
// }
</script>

<template>
  <u-container class="max-w-7xl">
    <!-- <u-page>
      <players-wrapper>
        <template #header-links>
          <view-switcher v-model="viewMode" />

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
      </players-wrapper>

      <u-page-body>
        <define-empty-template>
          <empty
            :icon="ICONS.noTournament"
            :message="`${playerName} has not ${selection ? 'won any titles' : 'played any finals'}.`"
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
          <reuse-empty-template v-else />
        </template>
        <u-table
          v-else
          ref="table"
          :data="events"
          :columns="titlesAndFinalsColumns"
          :loading="status === 'pending'"
          :faceted-options="{
            getFacetedRowModel: getFacetedRowModel(),
            getFacetedUniqueValues: getFacetedUniqueValues()
          }"
          sticky
          @select="handleSelect"
          :ui="{ root: 'w-fit min-w-1/3 mx-auto', tbody: '[&>tr]:cursor-pointer', td: 'empty:p-0' }"
        >
          <template #loading>
            <loading-icon />
          </template>
          <template #empty>
            <reuse-empty-template />
          </template>
        </u-table>
      </u-page-body>
    </u-page> -->
  </u-container>
</template>
