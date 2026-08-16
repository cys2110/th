<script setup lang="ts">
import { type Database, type Tables } from "~/types/database.types"
import { set, useInfiniteScroll, watchDeep } from "@vueuse/core"
import type { ContextMenuItem, TableColumn, TableRow } from "@nuxt/ui"
import { ICONS, TOUR_OPTIONS } from "#imports"
import { LazyTournamentCreate, UButton, UFieldGroup } from "#components"
import { CalendarDate, type DateValue } from "@internationalized/date"

type TournamentType = Tables<{ schema: "tennis" }, "tournament">
type TourEnum = Database["tennis"]["Enums"]["tour_enum"]

useHead({ title: "Tournaments" })

const route = useRoute("tournaments")
const router = useRouter()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const { isAdmin } = useAuthState()
const updateRouteQuery = useRouteQueryUpdater()

const selectedEstablishedDate = computed(() => {
  if (route.query.year) {
    return new CalendarDate(Number(route.query.year), 1, 1)
  }
  return undefined
})

const selectedAbolishedDate = computed(() => {
  if (route.query.year) {
    return new CalendarDate(Number(route.query.year), 1, 1)
  }
  return undefined
})

const count = ref(0)
const tournaments = ref<Array<TournamentType>>([])
const canLoadMore = ref(false)
const offset = ref(0)
const table = useTemplateRef("table")

const { pending, execute, refresh } = await useAsyncData(
  () => `tournaments-${JSON.stringify(route.query)}`,
  async () => {
    const query = supabase
      .schema("tennis")
      .from("tournament")
      .select("*", { count: "exact" })
      .order("name", { ascending: true })
      .order("id", { ascending: true }) // Add id sorting for consistent ordering
      .range(toValue(offset), toValue(offset) + 29)

    if (route.query.tour) query.overlaps("tours", route.query.tour)

    if (route.query.established) query.gte("established", Number(route.query.established))

    if (route.query.abolished) query.lte("abolished", Number(route.query.abolished))

    const { data, count: countData, error } = await query

    if (error || !data) {
      console.error("Error fetching tournaments:", error)
      return []
    }

    set(canLoadMore, data.length + tournaments.value.length < (countData || 0))
    set(count, countData || 0)
    set(tournaments, tournaments.value.concat(data))

    return data
  },
  {
    immediate: false,
    lazy: true,
    default: () => [],
    watch: [offset] // triggers when offset changes
  }
)

execute()

// Reset search results when filters change
watchDeep([() => route.query.tour, () => route.query.established, () => route.query.abolished], () => {
  set(tournaments, [])
  set(offset, 0)
  // refresh()
})

onMounted(() => {
  useInfiniteScroll(
    table.value?.$el,
    () => {
      if (pending.value) return

      offset.value += 30
    },
    {
      distance: 10,
      canLoadMore: () => canLoadMore.value
    }
  )
})

const columns: Array<TableColumn<TournamentType>> = [
  {
    accessorKey: "tours",
    header: "Tours",
    footer: () => `${count.value.toLocaleString()} tournament${count.value === 1 ? "" : "s"}`
  },
  {
    accessorKey: "name",
    header: "Tournament"
  },
  {
    id: "years",
    header: "Years",
    cell: ({ cell, row }) => {
      const { established, abolished } = row.original

      if (established) {
        if (abolished) {
          if (established === abolished) return established

          return `${established}-${abolished}`
        }

        return `${established}-present`
      }

      return cell.renderValue()
    },
    footer: () => {
      if (isAdmin.value) {
        return h(UFieldGroup, {}, () => [
          h(UButton, { icon: ui.icons.reload, onClick: () => refresh() }),
          h(LazyTournamentCreate, { hydrateOnIdle: true })
        ])
      }
    }
  }
]

// Select row
const handleSelectRow = (_: Event, row: TableRow<TournamentType>) => {
  const { id, name } = row.original

  router.push({
    name: "tournament",
    params: { id, name: kebabCase(name) }
  })
}

// Context menu
const contextItems = ref<Array<ContextMenuItem>>([])
const getContextItems = (row: TableRow<TournamentType>): Array<ContextMenuItem> =>
  [
    { label: row.original.name, type: "label" },
    {
      label: "Open in new tab",
      type: "link",
      to: { name: "tournament", params: { id: row.original.id, name: kebabCase(row.original.name) } },
      target: "_blank"
    },
    ...(row.original.website ?
      [
        {
          label: "Website",
          type: "link",
          href: row.original.website,
          target: "_blank"
        }
      ]
    : [])
  ] as Array<ContextMenuItem>

const onContextmenu = (e: Event, row: TableRow<TournamentType>) => {
  contextItems.value = getContextItems(row)
}
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header
        title="Tournaments"
        :ui="{ root: 'pb-4', description: 'flex justify-end gap-4' }"
      >
        <template #description>
          <u-select
            :model-value="<Array<TourEnum>>route.query.tour"
            @update:model-value="updateRouteQuery('tour', $event)"
            :items="[...TOUR_OPTIONS]"
            placeholder="Tour"
            multiple
            :icon="ICONS.tour"
          >
            <template #content-bottom>
              <u-button
                v-if="route.query.tour"
                variant="ghost"
                :icon="ui.icons.error"
                label="Clear"
                @click="updateRouteQuery('tour', [])"
              />
            </template>
          </u-select>

          <u-popover>
            <u-button
              variant="outline"
              color="neutral"
              :icon="ICONS.calendar"
              :label="<string>route.query.established || 'Established'"
              :class="route.query.established ? '' : 'text-dimmed font-normal'"
            />

            <template #content>
              <u-calendar
                :model-value="selectedEstablishedDate"
                @update:model-value="updateRouteQuery('established', $event ? ($event as DateValue).year : undefined)"
                type="year"
              />
            </template>
          </u-popover>

          <u-popover>
            <u-button
              variant="outline"
              color="neutral"
              :icon="ICONS.calendar"
              :label="<string>route.query.abolished || 'Abolished'"
              :class="route.query.abolished ? '' : 'text-dimmed font-normal'"
            />

            <template #content>
              <u-calendar
                :model-value="selectedAbolishedDate"
                @update:model-value="updateRouteQuery('abolished', $event ? ($event as DateValue).year : undefined)"
                type="year"
              />
            </template>
          </u-popover>
        </template>
      </u-page-header>

      <u-page-body>
        <u-context-menu :items="contextItems">
          <u-table
            ref="table"
            :data="tournaments"
            :columns
            sticky
            :loading="pending"
            @select="handleSelectRow"
            @contextmenu="onContextmenu"
            render-fallback-value="—"
            class="min-w-fit max-w-2/3 mx-auto"
          >
            <template #loading>
              <loading-icon />
            </template>

            <template #empty>
              <empty
                :icon="ICONS.trophyOff"
                title="No tournaments found"
                @refresh="refresh"
                class="mx-2"
              />
            </template>

            <template #tours-cell="{ row }">
              <div class="space-x-1">
                <u-badge
                  v-for="tour in row.original.tours"
                  :key="tour"
                  :label="tour"
                  :color="tour"
                />
              </div>
            </template>

            <template #name-cell="{ row }">
              <u-user
                :name="row.original.name"
                :avatar="{
                  src: row.original.logo_url || '',
                  loading: 'lazy',
                  icon: ICONS.trophy
                }"
                class="mx-auto w-fit"
              />
            </template>
          </u-table>
        </u-context-menu>
      </u-page-body>
    </u-page>
  </u-container>
</template>
