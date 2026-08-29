<script setup lang="ts">
definePageMeta({ name: "titles-and-finals" })

const route = useRoute("titles-and-finals")

const {
  ui: { colors }
} = useAppConfig()

const supabase = useSupabaseClient()
const router = useRouter()

const playerStore = usePlayerStore()

const { data: events, refresh } = await useAsyncData(
  () => `${route.params.id}-titles-and-finals`,
  async () => {
    const { data, error } = await supabase
      .from("activity")
      .select(
        `
      *,
      tournaments(name),
      events(event_surface_mapping(surfaces(*)))
    `
      )
      .eq("player_id", route.params.id)
      .eq("round", "Final")
      .is("tie_id", null)

    if (error) {
      console.error("Error fetching player activity:", error)
      return []
    }

    return data.map(event => ({
      ...event,
      surface:
        event.events ?
          `${event.events.event_surface_mapping[0]!.surfaces.environment} ${event.events.event_surface_mapping[0]!.surfaces.surface}`
        : null
    }))
  },
  { default: () => [] }
)

const filteredEvents = computed(() =>
  events.value.filter(event => {
    const query = route.query

    const isTitleMatch = !route.query.title || (route.query.title === "true" ? event.win : !event.win)
    const isYearMatch = !query.year || event.year === Number(query.year)
    const isTournamentMatch = !query.tournament || event.tournament_id === Number(query.tournament)
    const isLevelMatch = !query.level || event.level === query.level
    const isCategoryMatch = !query.category?.length || (event.category && query.category.includes(event.category))
    const isSurfaceMatch = !query.surface?.length || (event.surface && query.surface?.includes(event.surface))

    return isYearMatch && isTournamentMatch && isLevelMatch && isCategoryMatch && isSurfaceMatch && isTitleMatch
  })
)

const options = computed(() => {
  const years = useArrayUnique(events.value.map(e => String(e.year))).value
  const tournaments = useArrayUnique(
    events.value.map(e => ({ id: String(e.tournament_id), name: e.tournaments!.name })),
    (a, b) => a.id! === b.id!
  ).value
  const levels = useArrayUnique(events.value.map(e => e.level)).value
  const categories = useArrayUnique(events.value.map(e => e.category)).value
  const surfaces = useArrayUnique(events.value.map(e => e.surface)).value

  return { years, tournaments, levels, categories, surfaces }
})

const handleUpdateSelection = (key: string, value: string | string[] | null) => {
  const { [key]: _removed, ...query } = route.query
  const hasValue = Array.isArray(value) ? value.length > 0 : !!value

  router.push({
    name: "titles-and-finals",
    params: route.params,
    query: hasValue ? { ...query, [key]: value } : query
  })
}
</script>

<template>
  <u-container>
    <u-page>
      <player-wrapper />

      <u-page-body>
        <div class="flex justify-between">
          <div class="text-sm font-semibold">Total: {{ filteredEvents.length }}</div>
          <div class="flex gap-2 justify-end flex-1">
            <u-radio-group
              placeholder="Title/Final"
              :items="[
                {
                  value: 'true',
                  label: 'Titles'
                },
                {
                  value: 'false',
                  label: 'Finals'
                }
              ]"
              :model-value="<string>route.query.title || undefined"
              @update:model-value="handleUpdateSelection('title', $event)"
              :icon="ICONS.trophy"
              value-key="value"
              label-key="label"
              highlight
            />
            <u-select-menu
              placeholder="Year"
              :items="options.years"
              :model-value="<string>route.query.year || undefined"
              @update:model-value="handleUpdateSelection('year', $event)"
              :icon="ICONS.years"
              clear
              highlight
            />
            <u-select-menu
              placeholder="Level"
              :items="[...LEVELS]"
              :model-value="<LevelType>route.query.level || undefined"
              @update:model-value="handleUpdateSelection('level', $event)"
              :icon="ICONS.level"
              clear
              highlight
            />
            <u-select-menu
              placeholder="Category"
              :items="options.categories"
              :model-value="<Array<string>>route.query.category || undefined"
              @update:model-value="handleUpdateSelection('category', $event as string[])"
              :icon="ICONS.category"
              clear
              highlight
              multiple
              class="max-w-1/6"
            />
            <u-select-menu
              placeholder="Tournament"
              :items="options.tournaments"
              :model-value="<string>route.query.tournament || undefined"
              @update:model-value="handleUpdateSelection('tournament', $event)"
              :icon="ICONS.trophy"
              value-key="id"
              label-key="name"
              clear
              highlight
            />
            <u-select-menu
              placeholder="Surface"
              :items="options.surfaces"
              :model-value="<Array<string>>route.query.surface || undefined"
              @update:model-value="handleUpdateSelection('surface', $event as string[])"
              :icon="ICONS.court"
              clear
              highlight
              multiple
              class="max-w-1/6"
            />
          </div>
        </div>

        <div class="flex justify-center max-h-[70vh] overflow-y-auto">
          <u-timeline
            v-if="filteredEvents.length"
            :items="filteredEvents"
            :default-value="events.length - 1"
            :ui="{
              title: 'mb-2',
              item: 'even:flex-row-reverse even:-translate-x-[calc(100%-1.75rem)] even:text-right'
            }"
          >
            <template #indicator="{ item }">
              <u-icon
                v-if="item.win"
                :name="ICONS.trophy"
                class="text-xl"
              />
            </template>

            <template #title="{ item }">
              <u-link
                :to="{ name: 'tournament', params: { id: item.tournament_id!, name: kebabCase(item.tournaments!.name) } }"
                class="hover-link primary-link"
              >
                {{ item.tournaments!.name }}
              </u-link>
            </template>

            <template #date="{ item }">
              <u-link
                :to="{
                  name: 'edition',
                  params: { id: item.tournament_id!, name: kebabCase(item.tournaments!.name), year: item.year!, edId: item.edition_id! }
                }"
                class="hover-link primary-link"
              >
                {{ formatDate(new Date(item.end_date!)) }}
              </u-link>
            </template>

            <template #description="{ item }">
              <div class="space-y-1">
                <div class="space-x-1">
                  <u-badge
                    :label="<string>item.level"
                    :color="<keyof typeof colors>item.level"
                  />

                  <u-badge
                    :label="<string>item.match_type"
                    :color="<keyof typeof colors>item.match_type"
                  />
                </div>
                <div> {{ item.category }} | {{ item.surface }} </div>
                <div v-if="item.partner_id">
                  <span>Partner: </span>
                  <player-link
                    :players="[
                      {
                        id: item.partner_id,
                        first_name: item.partner_first_name,
                        last_name: item.partner_last_name,
                        full_name: `${item.partner_first_name} ${item.partner_last_name}`,
                        country: item.partner_country
                      }
                    ]"
                  />
                </div>
              </div>
            </template>
          </u-timeline>

          <empty
            v-else
            :icon="ICONS.trophyOff"
            :title="`${playerStore.fullName} has not won any titles or played any finals`"
            @refresh="refresh"
          />
        </div>
      </u-page-body>
    </u-page>
  </u-container>
</template>
