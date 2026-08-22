<script setup lang="ts">
import { parseDate } from "@internationalized/date"

const props = defineProps<{
  event: EventInterface
  showSurfaces: boolean
  showVenues: boolean
  startDate: string | null
}>()

const emits = defineEmits<{ refresh: [] }>()

const {
  params: { id, year }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const supabase = useSupabaseClient()
const toast = useToast()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const xlAndUp = breakpoints.greaterOrEqual("xl")

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const updatedEvent = ref<Record<string, any>>({})
const isSaving = ref(false)

const handleCheckboxCheck = (fields: string[]) => {
  for (const field of fields) {
    if (field in updatedEvent.value || (field === "start_date" && "dates" in updatedEvent.value)) {
      if (field === "start_date") {
        delete updatedEvent.value["dates"]
      } else {
        delete updatedEvent.value[field]
      }
    } else {
      if (field === "start_date") {
        updatedEvent.value.dates = {
          start: props.event?.start_date ? parseDate(props.event.start_date) : undefined,
          end: props.event?.end_date ? parseDate(props.event.end_date) : undefined
        }
      } else if (field === "supervisors") {
        updatedEvent.value[field] = props.event.supervisors.map(sup => ({
          id: sup.id,
          full_name: sup.full_name
        }))
      } else if (field === "venues") {
        updatedEvent.value[field] = props.event.venues.map(venue => ({
          id: venue.id,
          label: venue.name ? `${venue.name}, ${venue.city}` : venue.city,
          icon: venue.country.icon
        }))
      } else {
        updatedEvent.value[field] = props.event[field as keyof EventInterface]
      }
    }
  }
}

const handleSubmit = async () => {
  set(isSaving, true)

  try {
    const eventToUpdate: Partial<Record<keyof EventInterface, any>> = {}

    for (const [key, value] of Object.entries(updatedEvent.value)) {
      if (key === "dates") {
        if (value.start) {
          eventToUpdate.start_date = value.start.toString()
        }
        if (value.end) {
          eventToUpdate.end_date = value.end.toString()
        }
      } else if (key === "supervisors") {
        const supervisorsToAdd = value.filter((person: PersonInterface) => !props.event.supervisors.find(sup => sup.id === person.id))

        const supervisorsToDelete = props.event.supervisors.filter(sup => !value.find((person: PersonInterface) => person.id === sup.id)) || []

        if (supervisorsToAdd.length) {
          const { error: supervisorAddError } = await supabase.from("event_supervisor_mapping").insert(
            supervisorsToAdd.map((person: PersonInterface) => ({
              event_id: props.event.id,
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
            .eq("event_id", props.event.id)
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
      } else if (key === "venues") {
        const venuesToAdd = value.filter((venue: any) => !props.event.venues.find(v => v.id === venue.id))

        const venuesToDelete = props.event.venues.filter(v => !value.find((venue: any) => venue.id === v.id)) || []

        if (venuesToAdd.length) {
          const { error: venueAddError } = await supabase.from("event_venue_mapping").insert(
            venuesToAdd.map((venue: VenueInterface) => ({
              event_id: props.event.id,
              venue_id: venue.id
            }))
          )

          if (venueAddError) {
            console.error("Error adding venues", venueAddError)
            toast.add({
              title: "Error adding venues",
              color: "error",
              icon: icons.error
            })
          }
        }

        if (venuesToDelete.length) {
          const { error: venueDeleteError } = await supabase
            .from("event_venue_mapping")
            .delete()
            .eq("event_id", props.event.id)
            .in(
              "venue_id",
              venuesToDelete.map(v => v.id)
            )

          if (venueDeleteError) {
            console.error("Error deleting venues", venueDeleteError)
            toast.add({
              title: "Error deleting venues",
              color: "error",
              icon: icons.error
            })
          }
        }
      } else {
        eventToUpdate[key as keyof EventInterface] = value
      }
    }

    const { error } = await supabase
      .from("events")
      // @ts-expect-error
      .update(eventToUpdate)
      .eq("id", props.event.id)

    if (error) {
      console.error("Error updating event", error)
      toast.add({
        title: "Error updating event",
        color: "error",
        icon: icons.error
      })
      return
    }

    toast.add({
      title: `${tournamentStore.name} ${year} ${props.event.tour} successfully updated!`,
      icon: icons.success,
      color: "success"
    })

    set(updatedEvent, {})
    emits("refresh")
  } finally {
    set(isSaving, false)
  }
}
</script>

<template>
  <div class="w-full xl:min-w-1/2 px-5">
    <dashboard-subpanel>
      <template #right>
        <u-field-group>
          <template v-if="isAdmin">
            <lazy-scrape-atp-draw
              v-if="event.tour === 'ATP'"
              hydrate-on-idle
            />
            <lazy-scrape-wta-draw
              v-else-if="event.tour === 'WTA'"
              hydrate-on-idle
            />
            <lazy-scrape-results
              v-if="event.tour === 'ATP'"
              hydrate-on-idle
            />
            <lazy-scrape-rg
              v-if="id === '520'"
              :event-id="event.id"
              hydrate-on-idle
            />

            <lazy-scrape-atp-stats
              v-else-if="event.tour === 'ATP'"
              hydrate-on-idle
              :start-date="startDate || event.start_date"
            />
            <lazy-scrape-wta-stats
              v-else-if="event.tour === 'WTA'"
              hydrate-on-idle
            />

            <u-button
              :icon="ICONS.save"
              :loading="isSaving"
              :loading-icon="ICONS.uploading"
              @click="handleSubmit"
              :disabled="isSaving || !Object.keys(updatedEvent).length"
            />
          </template>
        </u-field-group>
      </template>

      <div v-if="(event.start_date && event.end_date) || isAdmin">
        <div class="flex justify-end">
          <u-checkbox
            v-if="isAdmin"
            highlight
            :icon="ICONS.racquet"
            :model-value="'dates' in updatedEvent"
            @update:model-value="() => handleCheckboxCheck(['start_date'])"
          />
        </div>

        <u-calendar
          v-if="'dates' in updatedEvent"
          v-model="updatedEvent.dates"
          range
          :month-controls="false"
          :year-controls="false"
          :week-starts-on="1"
          :weekday-format="xlAndUp ? 'long' : 'short'"
          :ui="{ root: 'max-w-fit mx-auto', cellTrigger: 'cursor-pointer' }"
        />

        <u-calendar
          v-else-if="event?.start_date && event?.end_date"
          range
          :default-value="{ start: parseDate(event.start_date), end: parseDate(event.end_date) }"
          readonly
          :month-controls="false"
          :year-controls="false"
          :week-starts-on="1"
          :weekday-format="xlAndUp ? 'long' : 'short'"
          class="max-w-fit mx-auto"
        />
      </div>
      <div
        class="flex-1 divide-y divide-default text-sm rounded-md overflow-hidden *:grid *:grid-cols-2 *:*:odd:bg-elevated *:*:odd:dark:bg-muted/50 *:*:px-4 *:*:py-1 *:*:even:font-medium *:*:even:text-muted [&_.detail]:flex [&_.detail]:items-center [&_.detail]:gap-2 [&_.detail]:*:first:flex-1"
      >
        <div v-if="event.sponsor_name || isAdmin">
          <div>Sponsor Name</div>
          <div class="detail">
            <form-input
              v-if="'sponsor_name' in updatedEvent"
              v-model="updatedEvent.sponsor_name"
              placeholder="Sponsor name"
            />

            <div v-else>{{ event.sponsor_name || "—" }}</div>

            <u-checkbox
              v-if="isAdmin"
              highlight
              :icon="ICONS.racquet"
              :model-value="'sponsor_name' in updatedEvent"
              @update:model-value="() => handleCheckboxCheck(['sponsor_name'])"
            />
          </div>
        </div>
        <div v-if="event.category">
          <div>Category</div>
          <div class="detail">
            <form-input
              v-if="'category' in updatedEvent"
              v-model="updatedEvent.category"
              placeholder="Category"
            />

            <div v-else>{{ event?.category || "—" }}</div>

            <u-checkbox
              v-if="isAdmin"
              highlight
              :icon="ICONS.racquet"
              :model-value="'category' in updatedEvent"
              @update:model-value="() => handleCheckboxCheck(['category'])"
            />
          </div>
        </div>
        <div v-if="showSurfaces || isAdmin">
          <div>Surfaces</div>
          <div class="detail">
            <u-input-menu
              v-if="'surfaces' in updatedEvent"
              v-model="updatedEvent.surfaces"
              placeholder="Surfaces"
              :icon="ICONS.court"
              :items="SURFACE_OPTIONS"
              value-key="id"
              label-key="label"
              multiple
              class="w-full"
            />

            <div v-else>
              <div
                v-if="event.surfaces.length"
                v-for="surface in event.surfaces"
                :key="surface.id"
              >
                {{ surface.environment }} {{ surface.surface }}
              </div>
              <div v-else>—</div>
            </div>

            <u-checkbox
              v-if="isAdmin"
              highlight
              :icon="ICONS.racquet"
              :model-value="'surfaces' in updatedEvent"
              @update:model-value="() => handleCheckboxCheck(['surfaces'])"
            />
          </div>
        </div>
        <div v-if="showVenues || isAdmin">
          <div>Venues</div>
          <div class="detail">
            <venue-search
              v-if="'venues' in updatedEvent"
              v-model="updatedEvent.venues"
              placeholder="Venues"
              multiple
            />

            <div v-else>
              <div
                v-if="event.venues.length"
                v-for="venue in event.venues"
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

            <u-checkbox
              v-if="isAdmin"
              highlight
              :icon="ICONS.racquet"
              :model-value="'venues' in updatedEvent"
              @update:model-value="() => handleCheckboxCheck(['venues'])"
            />
          </div>
        </div>
        <div v-if="(event.pm && event.currency) || isAdmin">
          <div>Prize Money</div>
          <div class="detail">
            <u-field-group v-if="'currency' in updatedEvent && 'pm' in updatedEvent">
              <u-input-menu
                v-model="updatedEvent.currency"
                :items="CURRENCY_OPTIONS"
                value-key="value"
                label-key="label"
                placeholder="e.g., $"
              />

              <form-input-number
                placeholder="PM"
                v-model="updatedEvent.pm"
                :currency="updatedEvent.currency || 'USD'"
              />
            </u-field-group>

            <div v-else>{{ event.pm?.toLocaleString("en-GB", { style: "currency", currency: event.currency! }) || "—" }}</div>

            <u-checkbox
              v-if="isAdmin"
              highlight
              :icon="ICONS.racquet"
              :model-value="'currency' in updatedEvent && 'pm' in updatedEvent && 'tfc' in updatedEvent"
              @update:model-value="() => handleCheckboxCheck(['currency', 'pm', 'tfc'])"
            />
          </div>
        </div>
        <div v-if="(event.tfc && event.currency) || isAdmin">
          <div>Total Financial Commitment</div>
          <div class="detail">
            <u-field-group v-if="'currency' in updatedEvent && 'tfc' in updatedEvent">
              <u-input-menu
                v-model="updatedEvent.currency"
                :items="CURRENCY_OPTIONS"
                value-key="value"
                label-key="label"
                placeholder="e.g., $"
              />

              <form-input-number
                placeholder="TFC"
                v-model="updatedEvent.tfc"
                :currency="updatedEvent.currency || 'USD'"
              />
            </u-field-group>

            <div v-else>{{ event.tfc?.toLocaleString("en-GB", { style: "currency", currency: event.currency! }) || "—" }}</div>

            <u-checkbox
              v-if="isAdmin"
              highlight
              :icon="ICONS.racquet"
              :model-value="'currency' in updatedEvent && 'tfc' in updatedEvent && 'pm' in updatedEvent"
              @update:model-value="() => handleCheckboxCheck(['currency', 'tfc', 'pm'])"
            />
          </div>
        </div>
        <div>
          <div>Supervisors</div>
          <div class="detail">
            <person-search
              v-if="'supervisors' in updatedEvent"
              v-model="updatedEvent.supervisors"
              placeholder="Supervisors"
              :icon="ICONS.supervisor"
              multiple
            />

            <div v-else>
              <div
                v-if="event.supervisors.length"
                v-for="supervisor in event.supervisors"
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
              :model-value="'supervisors' in updatedEvent"
              @update:model-value="() => handleCheckboxCheck(['supervisors'])"
            />
          </div>
        </div>

        <template v-if="isAdmin">
          <div>
            <div>Singles Draw</div>
            <div class="detail">
              <u-input-menu
                v-if="'s_draw' in updatedEvent"
                v-model="updatedEvent.s_draw"
                placeholder="Singles draw"
                :items="[...DRAWS]"
                class="w-full"
              />

              <div v-else>{{ event.s_draw || "—" }}</div>

              <u-checkbox
                v-if="isAdmin"
                highlight
                :icon="ICONS.racquet"
                :model-value="'s_draw' in updatedEvent"
                @update:model-value="() => handleCheckboxCheck(['s_draw'])"
              />
            </div>
          </div>

          <div>
            <div>Singles URL</div>
            <div class="detail">
              <form-textarea
                v-if="'s_link' in updatedEvent"
                v-model="updatedEvent.s_link"
                placeholder="Singles URL"
              />

              <div
                v-else
                class="truncate text-ellipsis"
              >
                {{ event.s_link || "—" }}
              </div>

              <u-checkbox
                highlight
                :icon="ICONS.racquet"
                :model-value="'s_link' in updatedEvent"
                @update:model-value="() => handleCheckboxCheck(['s_link'])"
              />
            </div>
          </div>

          <div>
            <div>Doubles Draw</div>
            <div class="detail">
              <u-input-menu
                v-if="'d_draw' in updatedEvent"
                v-model="updatedEvent.d_draw"
                placeholder="Doubles draw"
                :items="[...DRAWS]"
                class="w-full"
              />

              <div v-else>{{ event.d_draw || "—" }}</div>

              <u-checkbox
                v-if="isAdmin"
                highlight
                :icon="ICONS.racquet"
                :model-value="'d_draw' in updatedEvent"
                @update:model-value="() => handleCheckboxCheck(['d_draw'])"
              />
            </div>
          </div>

          <div>
            <div>Doubles URL</div>
            <div class="detail">
              <form-textarea
                v-if="'d_link' in updatedEvent"
                v-model="updatedEvent.d_link"
                placeholder="Doubles URL"
              />

              <div
                v-else
                class="truncate text-ellipsis"
              >
                {{ event.d_link || "—" }}
              </div>

              <u-checkbox
                highlight
                :icon="ICONS.racquet"
                :model-value="'d_link' in updatedEvent"
                @update:model-value="() => handleCheckboxCheck(['d_link'])"
              />
            </div>
          </div>

          <div>
            <div>Qualifying Singles Draw</div>
            <div class="detail">
              <u-input-menu
                v-if="'qs_draw' in updatedEvent"
                v-model="updatedEvent.qs_draw"
                placeholder="Qualifying singles draw"
                :items="[...DRAWS]"
                class="w-full"
              />

              <div v-else>{{ event.qs_draw || "—" }}</div>

              <u-checkbox
                v-if="isAdmin"
                highlight
                :icon="ICONS.racquet"
                :model-value="'qs_draw' in updatedEvent"
                @update:model-value="() => handleCheckboxCheck(['qs_draw'])"
              />
            </div>
          </div>

          <div>
            <div>Qualifying Singles URL</div>
            <div class="detail">
              <form-textarea
                v-if="'qs_link' in updatedEvent"
                v-model="updatedEvent.qs_link"
                placeholder="Qualifying singles URL"
              />

              <div
                v-else
                class="truncate text-ellipsis"
              >
                {{ event.qs_link || "—" }}
              </div>

              <u-checkbox
                highlight
                :icon="ICONS.racquet"
                :model-value="'qs_link' in updatedEvent"
                @update:model-value="() => handleCheckboxCheck(['qs_link'])"
              />
            </div>
          </div>

          <div>
            <div>Qualifying Doubles Draw</div>
            <div class="detail">
              <u-input-menu
                v-if="'qd_draw' in updatedEvent"
                v-model="updatedEvent.qd_draw"
                placeholder="Qualifying doubles draw"
                :items="[...DRAWS]"
                class="w-full"
              />

              <div v-else>{{ event.qd_draw || "—" }}</div>

              <u-checkbox
                v-if="isAdmin"
                highlight
                :icon="ICONS.racquet"
                :model-value="'qd_draw' in updatedEvent"
                @update:model-value="() => handleCheckboxCheck(['qd_draw'])"
              />
            </div>
          </div>

          <div>
            <div>Qualifying Doubles URL</div>
            <div class="detail">
              <form-textarea
                v-if="'qd_link' in updatedEvent"
                v-model="updatedEvent.qd_link"
                placeholder="Qualifying doubles URL"
              />

              <div
                v-else
                class="truncate text-ellipsis"
                >{{ event.qd_link || "—" }}</div
              >

              <u-checkbox
                highlight
                :icon="ICONS.racquet"
                :model-value="'qd_link' in updatedEvent"
                @update:model-value="() => handleCheckboxCheck(['qd_link'])"
              />
            </div>
          </div>
        </template>
      </div>
    </dashboard-subpanel>
  </div>
</template>
