<script setup lang="ts">
import { parseDate } from "@internationalized/date"

const {
  params: { id, year, edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const xlAndUp = breakpoints.greaterOrEqual("xl")

const supabase = useSupabaseClient()
const toast = useToast()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const updatedEdition = ref<Record<string, any>>({})
const isSaving = ref(false)

const isEliminationEdition = computed(() => !COUNTRY_DRAWS.includes(id) && id !== "9210")

const key = computed(() => `${edId}-details`)

const {
  data: edition,
  pending,
  refresh
} = await useAsyncData(key, async () => {
  const { data, error } = await supabase
    .from("editions")
    .select(
      `
      *,
      events(
        *,
        event_supervisor_mapping(people(*)),
        event_surface_mapping(surfaces(*)),
        event_venue_mapping(venues(*, countries(*)))
      )
    `
    )
    .eq("id", Number(edId))
    .order("tour", { referencedTable: "events", ascending: true })
    .single()

  if (error || !data) {
    console.error("Error fetching edition:", error)
    return null
  }

  const { events, ...rest } = data

  return {
    ...rest,
    events: events.map(event => {
      const { event_supervisor_mapping, event_surface_mapping, event_venue_mapping, ...rest } = event

      return {
        ...rest,
        supervisors: event_supervisor_mapping.map(mapping => mapping.people),
        surfaces: event_surface_mapping.map(mapping => mapping.surfaces),
        venues: event_venue_mapping.map(mapping => {
          return {
            id: mapping.venues?.id,
            name: mapping.venues?.name,
            city: mapping.venues?.city,
            country: mapping.venues?.countries
          }
        })
      }
    })
  } as EditionInterface
})

const surfaces = computed(() => {
  if (!edition.value) return []

  if (edition.value.events.length === 1) return edition.value.events[0]?.surfaces

  const firstSurfaces = edition.value.events[0]?.surfaces || []
  const followingSurfaces = edition.value.events.slice(1).map(e => e?.surfaces) || []

  if (followingSurfaces.every(s => isEqual(s, firstSurfaces))) return firstSurfaces

  return []
})

const venues = computed(() => {
  if (!edition.value) return []

  if (edition.value.events.length === 1) return edition.value.events[0]?.venues

  const firstVenues = edition.value.events[0]?.venues || []
  const followingVenues = edition.value.events.slice(1).map(e => e?.venues) || []

  if (followingVenues.every(v => isEqual(v, firstVenues))) return firstVenues

  return []
})

const handleCheckboxCheck = (fields: string[]) => {
  for (const field of fields) {
    if (field in updatedEdition.value || (field === "start_date" && "dates" in updatedEdition.value)) {
      if (field === "start_date") {
        delete updatedEdition.value["dates"]
      } else {
        delete updatedEdition.value[field]
      }
    } else {
      if (field === "start_date") {
        updatedEdition.value.dates = {
          start: edition.value?.start_date ? parseDate(edition.value.start_date) : undefined,
          end: edition.value?.end_date ? parseDate(edition.value.end_date) : undefined
        }
      } else if (field === "supervisors") {
        updatedEdition.value[field] = edition.value?.events[0]?.supervisors.map(person => ({
          id: person.id,
          full_name: person.full_name
        }))
      } else {
        updatedEdition.value[field] = edition.value?.[field as keyof EditionInterface]
      }
    }
  }
}

const handleSubmit = async () => {
  set(isSaving, true)

  try {
    const editionToUpdate: Partial<Record<keyof EditionInterface, any>> = {}

    for (const [key, value] of Object.entries(updatedEdition.value)) {
      if (key === "dates") {
        if (value.start) {
          editionToUpdate.start_date = value.start.toString()
        }

        if (value.end) {
          editionToUpdate.end_date = value.end.toString()
        }
      } else if (key === "supervisors") {
        const eventId = `${edId}-Country`

        const supervisorsToAdd = value.filter((person: PersonInterface) => !edition.value?.events[0]?.supervisors.find(sup => sup.id === person.id))

        const supervisorsToDelete =
          edition.value?.events[0]?.supervisors.filter(sup => !value.find((person: PersonInterface) => person.id === sup.id)) || []

        if (supervisorsToAdd.length) {
          const { error: supervisorAddError } = await supabase.from("event_supervisor_mapping").insert(
            supervisorsToAdd.map((person: PersonInterface) => ({
              event_id: eventId,
              supervisor_id: person.id
            }))
          )

          if (supervisorAddError) {
            console.error("Error adding supervisors", supervisorAddError)
            toast.add({
              title: "Error adding supervisors",
              color: "error",
              icon: icons.error
            })
          }
        }

        if (supervisorsToDelete.length) {
          const { error: supervisorDeleteError } = await supabase
            .from("event_supervisor_mapping")
            .delete()
            .eq("event_id", eventId)
            .in(
              "supervisor_id",
              supervisorsToDelete.map(sup => sup.id)
            )

          if (supervisorDeleteError) {
            console.error("Error deleting supervisors", supervisorDeleteError)
            toast.add({
              title: "Error deleting supervisors",
              color: "error",
              icon: icons.error
            })
          }
        }
      } else {
        editionToUpdate[key as keyof EditionInterface] = value
      }
    }

    const { error } = await supabase
      .from("editions")
      // @ts-expect-error
      .update(editionToUpdate)
      .eq("id", Number(edId))

    if (error) {
      console.error("Error updating edition", error)
      toast.add({
        title: "Error updating edition",
        color: "error",
        icon: icons.error
      })
      return
    }

    toast.add({
      title: `${tournamentStore.name} ${year} successfully updated!`,
      icon: icons.success,
      color: "success"
    })

    set(updatedEdition, {})
    refresh()
  } finally {
    set(isSaving, false)
  }
}
</script>

<template>
  <div>
    <div
      v-if="isAdmin"
      class="flex justify-end"
    >
      <u-field-group class="w-fit">
        <lazy-edition-event-create
          hydrate-on-idle
          @refresh="refresh"
        />
        <lazy-edition-country-rounds-create
          v-if="COUNTRY_DRAWS.includes(id)"
          hydrate-on-idle
        />
        <lazy-scrape-results
          v-if="!isEliminationEdition"
          hydrate-on-idle
        />
        <lazy-scrape-atp-stats
          v-if="!isEliminationEdition && edition"
          hydrate-on-idle
          :start-date="edition.start_date"
        />
        <u-button
          :icon="icons.reload"
          @click="refresh()"
        />

        <u-button
          :icon="ICONS.save"
          :loading="isSaving"
          :loading-icon="ICONS.uploading"
          :disabled="isSaving || !Object.keys(updatedEdition).length"
          @click="handleSubmit"
        />
      </u-field-group>
    </div>

    <div
      v-if="edition || pending"
      class="flex gap-4 2xl:max-w-3/4 mx-auto"
    >
      <div
        class="mt-4 flex-1 divide-y divide-default text-sm rounded-md overflow-hidden *:grid *:grid-cols-2 *:*:odd:bg-elevated *:*:odd:dark:bg-muted/50 *:*:px-4 *:*:py-1 *:*:even:font-medium *:*:even:text-muted [&_.detail]:flex [&_.detail]:items-center [&_.detail]:gap-2 [&_.detail]:*:first:flex-1"
      >
        <div v-if="edition?.sponsor_name || pending || isAdmin">
          <div>Sponsor Name</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div
            v-else
            class="detail"
          >
            <form-input
              v-if="'sponsor_name' in updatedEdition"
              v-model="updatedEdition.sponsor_name"
              placeholder="Sponsor name"
            />

            <div v-else>{{ edition?.sponsor_name || "—" }}</div>

            <u-checkbox
              v-if="isAdmin"
              highlight
              :icon="ICONS.racquet"
              :model-value="'sponsor_name' in updatedEdition"
              @update:model-value="() => handleCheckboxCheck(['sponsor_name'])"
            />
          </div>
        </div>

        <div v-if="edition?.category || pending || isAdmin">
          <div>Category</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div
            v-else
            class="detail"
          >
            <form-input
              v-if="'category' in updatedEdition"
              v-model="updatedEdition.category"
              placeholder="Category"
            />

            <div v-else>{{ edition?.category || "—" }}</div>

            <u-checkbox
              v-if="isAdmin"
              highlight
              :icon="ICONS.racquet"
              :model-value="'category' in updatedEdition"
              @update:model-value="() => handleCheckboxCheck(['category'])"
            />
          </div>
        </div>

        <div v-if="surfaces?.length || pending">
          <div>Surfaces</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            <div
              v-if="surfaces?.length"
              v-for="surface in surfaces"
              :key="surface.id"
            >
              {{ surface.environment }} {{ surface.surface }}
            </div>
            <div v-else>—</div>
          </div>
        </div>

        <div v-if="venues?.length || pending">
          <div>Venues</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            <div
              v-if="venues?.length"
              v-for="venue in venues"
              :key="venue.id"
              class="flex items-center gap-2"
            >
              {{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}
              <country-link
                :country="venue.country"
                icon-only
              />
            </div>
            <div v-else>—</div>
          </div>
        </div>

        <div v-if="edition?.currency || pending || isAdmin">
          <div>Total Financial Commitment</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div
            v-else
            class="detail"
          >
            <u-field-group v-if="'currency' in updatedEdition && 'tfc' in updatedEdition">
              <u-input-menu
                v-model="updatedEdition.currency"
                :items="CURRENCY_OPTIONS"
                value-key="value"
                label-key="label"
                placeholder="e.g., $"
              />

              <form-input-number
                placeholder="TFC"
                v-model="updatedEdition.tfc"
                :currency="updatedEdition.currency || 'USD'"
              />
            </u-field-group>

            <div v-else>{{ edition?.tfc?.toLocaleString("en-GB", { style: "currency", currency: edition.currency! }) || "—" }}</div>

            <u-checkbox
              v-if="isAdmin"
              highlight
              :icon="ICONS.racquet"
              :model-value="'currency' in updatedEdition && 'tfc' in updatedEdition"
              @update:model-value="() => handleCheckboxCheck(['currency', 'tfc'])"
            />
          </div>
        </div>

        <div v-if="COUNTRY_DRAWS.includes(id)">
          <div>Supervisors</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div
            v-else
            class="detail"
          >
            <person-search
              v-if="'supervisors' in updatedEdition"
              v-model="updatedEdition.supervisors"
              placeholder="Supervisors"
              :icon="ICONS.supervisor"
              multiple
            />

            <div v-else>
              <div
                v-if="edition?.events.flatMap(e => e.supervisors).length"
                v-for="supervisor in edition.events.flatMap(e => e.supervisors)"
                :key="supervisor.id"
              >
                {{ supervisor.full_name }}
              </div>
              <div v-else>—</div>
            </div>

            <u-checkbox
              v-if="isAdmin"
              highlight
              :icon="ICONS.racquet"
              :model-value="'supervisors' in updatedEdition"
              @update:model-value="() => handleCheckboxCheck(['supervisors'])"
            />
          </div>
        </div>

        <template v-if="isAdmin">
          <div>
            <div>Wikipedia Link</div>
            <div v-if="pending">
              <u-skeleton class="w-full h-4" />
            </div>
            <div
              v-else
              class="detail"
            >
              <form-textarea
                v-if="'wiki_link' in updatedEdition"
                v-model="updatedEdition.wiki_link"
                placeholder="Wikipedia link"
              />

              <div v-else>{{ edition?.wiki_link || "—" }}</div>

              <u-checkbox
                highlight
                :icon="ICONS.racquet"
                :model-value="'wiki_link' in updatedEdition"
                @update:model-value="() => handleCheckboxCheck(['wiki_link'])"
              />
            </div>
          </div>

          <div>
            <div>Draw Type</div>
            <div v-if="pending">
              <u-skeleton class="w-full h-4" />
            </div>
            <div
              v-else
              class="detail"
            >
              <u-input-menu
                v-if="'draw_type' in updatedEdition"
                v-model="updatedEdition.draw_type"
                placeholder="Draw type"
                :items="[...DRAW_TYPES]"
                class="w-full"
              />

              <div v-else>{{ edition?.draw_type || "—" }}</div>

              <u-checkbox
                v-if="isAdmin"
                highlight
                :icon="ICONS.racquet"
                :model-value="'draw_type' in updatedEdition"
                @update:model-value="() => handleCheckboxCheck(['draw_type'])"
              />
            </div>
          </div>

          <div>
            <div>Draw Link</div>
            <div v-if="pending">
              <u-skeleton class="w-full h-4" />
            </div>
            <div
              v-else
              class="detail"
            >
              <form-textarea
                v-if="'draw_link' in updatedEdition"
                v-model="updatedEdition.draw_link"
                placeholder="Draw link"
              />

              <div v-else>{{ edition?.draw_link || "—" }}</div>

              <u-checkbox
                highlight
                :icon="ICONS.racquet"
                :model-value="'draw_link' in updatedEdition"
                @update:model-value="() => handleCheckboxCheck(['draw_link'])"
              />
            </div>
          </div>

          <div>
            <div>Updated at</div>
            <div v-if="pending">
              <u-skeleton class="w-full h-4" />
            </div>
            <div v-else>
              <u-badge
                v-if="edition?.updated_at"
                :label="formatDateTime(edition.updated_at)"
                color="success"
              />
            </div>
          </div>
        </template>
      </div>

      <div v-if="(edition?.start_date && edition?.end_date) || isAdmin">
        <div class="flex justify-end">
          <u-checkbox
            v-if="isAdmin"
            highlight
            :icon="ICONS.racquet"
            :model-value="'dates' in updatedEdition"
            @update:model-value="() => handleCheckboxCheck(['start_date'])"
          />
        </div>

        <u-calendar
          v-if="'dates' in updatedEdition"
          v-model="updatedEdition.dates"
          range
          :month-controls="false"
          :year-controls="false"
          :week-starts-on="1"
          :weekday-format="xlAndUp ? 'long' : 'short'"
          :ui="{ root: 'max-w-fit mx-auto', cellTrigger: 'cursor-pointer' }"
        />

        <u-calendar
          v-else-if="edition?.start_date && edition?.end_date"
          range
          :default-value="{ start: parseDate(edition.start_date), end: parseDate(edition.end_date) }"
          readonly
          :month-controls="false"
          :year-controls="false"
          :week-starts-on="1"
          :weekday-format="xlAndUp ? 'long' : 'short'"
          class="max-w-fit mx-auto"
        />
      </div>
    </div>
  </div>

  <div
    v-if="!COUNTRY_DRAWS.includes(id) && id !== '9210'"
    class="flex flex-wrap xl:flex-nowrap mt-5"
  >
    <edition-event-details
      v-for="event in edition?.events"
      :key="event.id"
      :event
      :show-surfaces="!surfaces?.length"
      :show-venues="!venues?.length"
      :start-date="edition!.start_date"
      @refresh="refresh"
    />
  </div>
</template>
