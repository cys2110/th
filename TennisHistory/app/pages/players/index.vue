<script setup lang="ts">
import { type Tables } from "~/types/database.types"
import { set, useInfiniteScroll, watchDeep } from "@vueuse/core"
import type { ContextMenuItem, TableColumn, TableRow } from "@nuxt/ui"
import { ICONS, TOUR_OPTIONS, TourEnum } from "#imports"
import { LazyPlayerCreate, UButton, UFieldGroup } from "#components"
import { CalendarDate, type DateValue } from "@internationalized/date"

type PlayerType = Tables<{ schema: "tennis" }, "player_details">

useHead({ title: "Players" })

const route = useRoute("players")
const router = useRouter()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const { isAdmin } = useAuthState()
const updateRouteQuery = useRouteQueryUpdater()
const { countries, pending: pendingCountries, fetchCountries } = useCountryList()

const selectedTurnedProDate = computed(() => {
  if (route.query.turned_pro) {
    return new CalendarDate(Number(route.query.turned_pro), 1, 1)
  }
  return undefined
})

const selectedRetiredDate = computed(() => {
  if (route.query.retired) {
    return new CalendarDate(Number(route.query.retired), 1, 1)
  }
  return undefined
})

const selectedFirstYearDate = computed(() => {
  if (route.query.first_year) {
    return new CalendarDate(Number(route.query.first_year), 1, 1)
  }
  return undefined
})

const selectedLastYearDate = computed(() => {
  if (route.query.last_year) {
    return new CalendarDate(Number(route.query.last_year), 1, 1)
  }
  return undefined
})

const count = ref(0)
const players = ref<Array<PlayerType>>([])
const canLoadMore = ref(false)
const offset = ref(0)
const table = useTemplateRef("table")

const { pending, execute, refresh } = await useAsyncData(
  () => `players-${JSON.stringify(route.query)}`,
  async () => {
    const query = supabase
      .schema("tennis")
      .from("player_details")
      .select("id, full_name, tour, country, turned_pro, retired, tournament_years, image_url", { count: "exact" })
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .order("id", { ascending: true }) // Add id sorting for consistent ordering
      .range(toValue(offset), toValue(offset) + 29)

    if (route.query.tour) query.eq("tour", route.query.tour as TourEnum)

    if (route.query.turned_pro) query.gte("turned_pro", Number(route.query.turned_pro))

    if (route.query.retired) query.lte("retired", Number(route.query.retired))

    if (route.query.first_year) query.gte("tournament_years->first", Number(route.query.first_year))

    if (route.query.last_year) query.lte("tournament_years->last", Number(route.query.last_year))

    if (route.query.country)
      query.in("country->>id", Array.isArray(route.query.country) ? (route.query.country as string[]) : [route.query.country as string])

    const { data, count: countData, error } = await query

    if (error || !data) {
      console.error("Error fetching players:", error)
      return []
    }

    set(canLoadMore, data.length + players.value.length < (countData || 0))
    set(count, countData || 0)
    set(players, players.value.concat(data as Array<PlayerType>))

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
watchDeep(
  [() => route.query.tour, () => route.query.turned_pro, () => route.query.retired, () => route.query.first_year, () => route.query.last_year],
  () => {
    set(players, [])
    set(offset, 0)
  }
)

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

const columns: Array<TableColumn<PlayerType>> = [
  {
    accessorKey: "tour",
    header: "Tour",
    footer: () => `${count.value.toLocaleString()} player${count.value === 1 ? "" : "s"}`
  },
  {
    accessorKey: "country",
    header: "Country"
  },
  {
    accessorKey: "full_name",
    header: "Player"
  },
  {
    id: "pro_years",
    header: "Pro Years",
    cell: ({ cell, row }) => {
      const { turned_pro, retired } = row.original

      if (turned_pro && retired) {
        if (turned_pro === retired) {
          return turned_pro
        } else {
          return `${turned_pro}-${retired}`
        }
      } else if (turned_pro) {
        return `Pro: ${turned_pro}`
      } else if (retired) {
        return `Retired: ${retired}`
      }

      return cell.renderValue()
    }
  },
  {
    id: "active_years",
    header: "Active Years",
    cell: ({ cell, row }) => {
      const { tournament_years }: any = row.original

      if (tournament_years.first) {
        if (tournament_years.first === tournament_years.last) {
          return tournament_years.first
        } else if (tournament_years.last === new Date().getFullYear()) {
          return `${tournament_years.first}-present`
        } else {
          return `${tournament_years.first}-${tournament_years.last}`
        }
      }

      return cell.renderValue()
    },
    footer: () => {
      if (isAdmin.value) {
        return h(UFieldGroup, {}, () => [
          h(UButton, { icon: ui.icons.reload, onClick: () => refresh() }),
          h(LazyPlayerCreate, { hydrateOnIdle: true })
        ])
      }
    }
  }
]

// Select row
const handleSelectRow = (_: Event, row: TableRow<PlayerType>) => {
  const { id, full_name } = row.original

  router.push({
    name: "player",
    params: { id: id!, name: kebabCase(full_name as string) }
  })
}

// Context menu
const contextItems = ref<Array<ContextMenuItem>>([])
const getContextItems = (row: TableRow<PlayerType>): Array<ContextMenuItem> =>
  [
    { label: row.original.full_name, type: "label" },
    {
      label: "Open in new tab",
      type: "link",
      to: { name: "player", params: { id: row.original.id, name: kebabCase(row.original.full_name!) } },
      target: "_blank"
    }
  ] as Array<ContextMenuItem>

const onContextmenu = (e: Event, row: TableRow<PlayerType>) => {
  contextItems.value = getContextItems(row)
}
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header
        title="Players"
        :ui="{ root: 'pb-4', description: 'flex justify-end gap-4' }"
      >
        <template #description>
          <u-select
            :model-value="<TourEnum>route.query.tour"
            @update:model-value="updateRouteQuery('tour', $event)"
            :items="[...TOUR_OPTIONS]"
            placeholder="Tour"
            :icon="ICONS.tour"
          >
            <template #content-bottom>
              <u-button
                v-if="route.query.tour"
                variant="ghost"
                :icon="ui.icons.error"
                label="Clear"
                @click="updateRouteQuery('tour', null)"
              />
            </template>
          </u-select>

          <u-input-menu
            :model-value="<Array<string>>(Array.isArray(route.query.country) ? route.query.country : [route.query.country].filter(Boolean))"
            @update:model-value="updateRouteQuery('country', $event)"
            :items="countries"
            :loading="pendingCountries"
            label-key="name"
            value-key="id"
            placeholder="Country"
            multiple
            :icon="ICONS.globe"
          >
            <template #content-bottom>
              <u-button
                v-if="route.query.country"
                variant="ghost"
                :icon="ui.icons.error"
                label="Clear"
                @click="updateRouteQuery('country', [])"
              />
            </template>
          </u-input-menu>

          <u-popover>
            <u-button
              variant="outline"
              color="neutral"
              :icon="ICONS.calendar"
              :label="<string>route.query.turned_pro || 'Turned Pro'"
              :class="route.query.turned_pro ? '' : 'text-dimmed font-normal'"
            />

            <template #content>
              <u-calendar
                :model-value="selectedTurnedProDate"
                @update:model-value="updateRouteQuery('turned_pro', $event ? ($event as DateValue).year : undefined)"
                type="year"
              />
            </template>
          </u-popover>

          <u-popover>
            <u-button
              variant="outline"
              color="neutral"
              :icon="ICONS.calendar"
              :label="<string>route.query.retired || 'Retired'"
              :class="route.query.retired ? '' : 'text-dimmed font-normal'"
            />

            <template #content>
              <u-calendar
                :model-value="selectedRetiredDate"
                @update:model-value="updateRouteQuery('retired', $event ? ($event as DateValue).year : undefined)"
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
            :data="players"
            :columns
            sticky
            :loading="pending"
            @select="handleSelectRow"
            @contextmenu="onContextmenu"
            render-fallback-value="—"
            class="min-w-fit max-w-3/4 mx-auto"
          >
            <template #loading>
              <loading-icon />
            </template>

            <template #empty>
              <empty
                :icon="ICONS.peopleOff"
                title="No players found"
                @refresh="refresh"
                class="mx-2"
              />
            </template>

            <template #tour-cell="{ cell }">
              <u-badge
                :label="cell.getValue<TourEnum>()"
                :color="cell.getValue<TourEnum>()"
              />
            </template>

            <template #country-cell="{ row }">
              <country-link
                v-if="row.original.country"
                :country="row.original.country"
                icon-only
                class="mx-auto"
              />
            </template>

            <template #full_name-cell="{ row }">
              <u-user
                :name="row.original.full_name!"
                :avatar="{
                  src: row.original.image_url || '',
                  loading: 'lazy',
                  icon: ICONS.player
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
