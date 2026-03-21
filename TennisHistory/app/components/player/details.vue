<script setup lang="ts">
import { CalendarDate, parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const props = defineProps<{
  player?: PlayerInterface | null
  pending: boolean
}>()

const {
  params: { id }
} = useRoute("player")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const { data: countries, pending: countriesPending } = await useAsyncData(
  "countries",
  async () => {
    const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching countries:", error)
      return []
    }

    return data.map(country => ({
      ...country,
      icon: getFlagCode(country)
    }))
  },
  { default: () => [] }
)

const playerStore = usePlayerStore()

const isUploading = ref(false)

const initialState = computed(() => ({
  ...props.player,
  first_name: props.player?.first_name || "",
  last_name: props.player?.last_name || "",
  rh: props.player?.rh || undefined,
  bh: props.player?.bh || undefined,
  wiki_link: props.player?.wiki_link || undefined,
  official_link: props.player?.official_link || undefined,
  coaches: props.player?.coaches.map(coach => ({
    id: coach.id,
    years: coach.years,
    status: coach.status,
    coach: coach.coach.id
  }))
}))

const state = ref<Partial<PlayerUpdateType>>(cloneDeep(initialState.value))

watch(
  initialState,
  () => {
    if (props.player) {
      state.value = cloneDeep(initialState.value)
    }
  },
  { deep: true, immediate: true }
)

const dob = shallowRef<CalendarDate | undefined>(props.player?.dob ? parseDate(props.player.dob) : undefined)
const dod = shallowRef<CalendarDate | undefined>(props.player?.dod ? parseDate(props.player.dod) : undefined)

watch(dob, newDate => {
  state.value.dob = newDate?.toString() || null
})

watch(dod, newDate => {
  state.value.dod = newDate?.toString() || null
})

const handleReset = () => {
  set(state, cloneDeep(initialState.value))
  dob.value = props.player?.dob ? parseDate(props.player.dob) : undefined
  dod.value = props.player?.dod ? parseDate(props.player.dod) : undefined
}

const onError = (event: FormErrorEvent) => console.error(event.errors)

const currentYear = new Date().getFullYear()

const getAge = (dob: Date, endDate: Date) => {
  let age = endDate.getFullYear() - dob.getFullYear()
  const monthDiff = endDate.getMonth() - dob.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < dob.getDate())) {
    age--
  }

  return `${age} years old`
}

const playerAge = computed(() => {
  if (props.player?.dob) {
    const dob = new Date(props.player.dob)
    if (props.player.dod) {
      return getAge(dob, new Date(props.player.dod))
    } else {
      return getAge(dob, new Date())
    }
  }

  return "—"
})

const onSubmit = async (event: FormSubmitEvent<PlayerUpdateType>) => {
  set(isUploading, true)

  // Only send fields that have changed to reduce payload size
  const fields = Object.keys(event.data) as Array<keyof PlayerUpdateType>

  const dirtyFields: Partial<PlayerUpdateType> = {}

  for (const field of fields) {
    if (field === "id") {
      continue
    } else {
      let startingValue = initialState.value[field] as any

      if (!isEqual(event.data[field], startingValue)) {
        dirtyFields[field] = (event.data[field] as any) ?? null
      }
    }
  }

  if (Object.keys(dirtyFields).length) {
    const { coaches, countries, ...rest } = dirtyFields

    const { error } = await supabase
      .from("players")
      .update({ ...rest })
      .eq("id", id)

    if (error) {
      console.error("Error updating player:", error)
      set(isUploading, false)
      return
    }

    const newCoaches = coaches?.filter(coach => !coach.id)
    const updatedCoaches = coaches?.filter(coach => coach.id)

    const newCountries = countries?.filter(country => !country.id)
    const updatedCountries = countries?.filter(country => country.id)

    if (newCoaches?.length) {
      const { error } = await supabase.from("player_coach_mapping").insert(
        newCoaches.map(coach => ({
          player_id: id,
          coach_id: coach.coach,
          years: coach.years,
          status: coach.status
        }))
      )

      if (error) {
        console.error("Error inserting new coaches:", error)
      }
    }

    if (updatedCoaches?.length) {
      for (const coach of updatedCoaches) {
        const { error } = await supabase.from("player_coach_mapping").update({ years: coach.years, status: coach.status }).eq("id", coach.id!)

        if (error) {
          console.error(`Error updating coach ${coach.id}:`, error)
        }
      }
    }

    if (newCountries?.length) {
      const { error } = await supabase.from("player_country_mapping").insert(
        newCountries.map(country => ({
          player_id: id,
          country_id: country.country.id,
          start_date: country.start_date,
          end_date: country.end_date
        }))
      )

      if (error) {
        console.error("Error inserting new countries:", error)
      }
    }

    if (updatedCountries?.length) {
      for (const country of updatedCountries) {
        const { error } = await supabase
          .from("player_country_mapping")
          .update({ start_date: country.start_date, end_date: country.end_date })
          .eq("id", country.id!)

        if (error) {
          console.error(`Error updating country ${country.id}:`, error)
        }
      }
    }

    toast.add({
      title: `${event.data.first_name} ${event.data.last_name} successfully updated!`,
      description: JSON.stringify(event.data),
      icon: icons.success,
      color: "success"
    })

    reloadNuxtApp()
  } else {
    toast.add({
      title: "No changes to save",
      description: `${event.data.first_name} ${event.data.last_name}`,
      icon: icons.caution,
      color: "warning"
    })
  }

  set(isUploading, false)
}
</script>

<template>
  <div id="details">
    <dev-only>
      <div class="flex justify-end gap-2 mb-3">
        <u-button
          form="player-form"
          type="submit"
          :icon="isUploading ? ICONS.uploading : ICONS.save"
          color="warning"
        />

        <u-button
          :icon="icons.reload"
          color="warning"
          @click="handleReset"
        />
      </div>
    </dev-only>

    <u-form
      id="player-form"
      :state
      :schema="PlayerUpdateSchema"
      @submit="onSubmit"
      @error="onError"
    >
      <div
        class="flex-1 divide-y divide-default text-sm rounded-md overflow-hidden *:grid *:grid-cols-2 *:*:odd:bg-elevated *:*:odd:dark:bg-muted/50 *:*:px-4 *:*:py-1 *:*:even:font-medium *:*:even:text-muted"
      >
        <dev-only>
          <div>
            <div>Name</div>
            <div v-if="pending">
              <u-skeleton class="w-full h-4" />
            </div>
            <div v-else>
              <u-form-field :error-pattern="/^(first_name|last_name)$/">
                <u-field-group>
                  <form-input
                    placeholder="Enter first name"
                    v-model="state.first_name"
                  />

                  <form-input
                    placeholder="Enter last name"
                    v-model="state.last_name"
                  />
                </u-field-group>
              </u-form-field>
            </div>
          </div>
        </dev-only>

        <div>
          <!--Age-->
          <div class="flex flex-col justify-evenly">
            <dev-only>
              Date of Birth/Death

              <template #fallback>Age</template>
            </dev-only>
          </div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            <dev-only>
              <u-form-field :error-pattern="/^(dob|dod)$/">
                <u-field-group>
                  <form-date-picker v-model="dob" />

                  <form-date-picker v-model="dod" />
                </u-field-group>
              </u-form-field>

              <template #fallback>
                <div>{{ playerAge }}</div>
                <div v-if="player?.dob">
                  {{ formatDate(player.dob, player?.dod || undefined) }}
                </div>
              </template>
            </dev-only>
          </div>
        </div>

        <div>
          <!--Height-->
          <div>Height</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            <dev-only>
              <u-form-field name="height">
                <u-field-group>
                  <form-input-number
                    v-model="state.height"
                    placeholder="Enter height in cm"
                  />
                  <u-badge
                    label="cm"
                    color="neutral"
                    variant="outline"
                  />
                </u-field-group>
              </u-form-field>

              <template #fallback>
                <div>{{ player?.height ? `${player.height} cm` : "—" }}</div>
                <div v-if="player?.height">{{ convertToFt(player.height) }}</div>
              </template>
            </dev-only>
          </div>
        </div>

        <div>
          <div>Plays</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            <dev-only>
              <u-form-field name="rh">
                <u-radio-group
                  :items="['Right', 'Left']"
                  v-model="state.rh"
                  orientation="horizontal"
                  loop
                />
              </u-form-field>

              <template #fallback>
                {{ player?.rh ? `${player.rh}-handed` : "—" }}
              </template>
            </dev-only>
          </div>
        </div>

        <div>
          <div>Backhand</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            <dev-only>
              <u-form-field name="bh">
                <u-radio-group
                  :items="['One', 'Two']"
                  v-model="state.bh"
                  orientation="horizontal"
                  loop
                />
              </u-form-field>

              <template #fallback>
                {{ player?.bh ? `${player.bh}-handed` : "—" }}
              </template>
            </dev-only>
          </div>
        </div>

        <div>
          <!--Pro years-->
          <dev-only>
            <div>Pro Years</div>
            <template #fallback>
              <div v-if="!player || (player.turned_pro && player.retired)">Pro Years</div>
              <div v-else-if="player.turned_pro">Turned Pro</div>
              <div v-else>Retired</div>
            </template>
          </dev-only>

          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>

          <div v-else>
            <dev-only>
              <u-form-field :error-pattern="/^(turned_pro|retired)$/">
                <u-field-group>
                  <form-input
                    type="number"
                    placeholder="Enter year turned pro"
                    v-model="state.turned_pro"
                  />

                  <form-input
                    type="number"
                    placeholder="Enter year retired"
                    v-model="state.retired"
                  />
                </u-field-group>
              </u-form-field>

              <template #fallback>
                <div v-if="player?.turned_pro || player?.retired">
                  <div>
                    <span v-if="player.turned_pro">{{ player.turned_pro }}</span>
                    <span v-if="player.turned_pro && player.retired"> - </span>
                    <span v-if="player.retired">{{ player.retired }}</span>
                  </div>
                  <div v-if="player.turned_pro && (player.retired || playerStore.activeYears.includes(currentYear))">
                    ({{ currentYear - player.turned_pro }} years pro)
                  </div>
                </div>
                <div v-else>—</div>
              </template>
            </dev-only>
          </div>
        </div>

        <div>
          <!--Hof-->
          <div>Hall of Fame Induction</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            <dev-only>
              <u-form-field name="hof">
                <form-input
                  type="number"
                  placeholder="Enter Hall of Fame Induction Year"
                  v-model="state.hof"
                />
              </u-form-field>

              <template #fallback>
                {{ player?.hof || "—" }}
              </template>
            </dev-only>
          </div>
        </div>

        <!--Ranking-->
        <div>
          <div>Singles Ranking</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div class="flex gap-10 *:text-center *:w-fit">
            <div>
              <div>{{ player?.current_singles ?? "—" }}</div>
              <div class="text-dimmed">Current</div>
            </div>
            <div>
              <div>{{ player?.ch_singles ?? "—" }}</div>
              <div
                v-if="player?.ch_singles_date"
                class="text-dimmed"
              >
                {{ formatDate(player.ch_singles_date) }}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div>Doubles Ranking</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div class="flex gap-10 *:text-center *:w-fit">
            <div>
              <div>{{ player?.current_doubles ?? "—" }}</div>
              <div class="text-dimmed">Current</div>
            </div>
            <div>
              <div>{{ player?.ch_doubles ?? "—" }}</div>
              <div
                v-if="player?.ch_doubles_date"
                class="text-dimmed"
              >
                {{ formatDate(player.ch_doubles_date) }}
              </div>
            </div>
          </div>
        </div>

        <div>
          <!--Pm-->
          <div>Prize Money</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div>{{ player?.pm?.toLocaleString("en-GB", { style: "currency", currency: "USD" }) || "—" }}</div>
        </div>

        <div>
          <!--Coaches-->
          <div>Coaches</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            <dev-only>
              <u-form
                v-for="(coach, index) in state.coaches"
                :key="index"
                :schema="PlayerUpdateSchema.shape.coaches.element"
                :name="`coaches.${index}`"
                nested
                class="my-1"
              >
                <u-form-field :error-pattern="/^(coach|years|status)$/">
                  <u-field-group>
                    <person-search
                      v-model="coach.coach"
                      placeholder="Select coach"
                      :icon="ICONS.coach"
                      :start-value="
                        player?.coaches[index] ?
                          {
                            id: coach.coach,
                            label: `${player?.coaches[index]!.coach.first_name} ${player?.coaches[index]!.coach.last_name}`
                          }
                        : undefined
                      "
                    />

                    <form-input
                      placeholder="Enter years coached"
                      v-model="coach.years"
                    />

                    <u-select
                      v-model="coach.status"
                      :items="['Current', 'Former']"
                    />

                    <u-button
                      :icon="icons.close"
                      @click="state.coaches!.splice(index, 1)"
                      color="error"
                    />
                  </u-field-group>
                </u-form-field>
              </u-form>

              <u-button
                block
                @click="state.coaches!.push({ status: 'Current', years: '', coach: '' })"
                :icon="icons.plus"
                label="Add Coach"
              />

              <template #fallback>
                <div
                  v-if="player?.coaches.length"
                  v-for="coach in player?.coaches"
                  :key="coach.id"
                >
                  <u-link
                    v-if="coach.coach.player_id"
                    :to="{ name: 'player', params: { id: coach.id, name: kebabCase(`${coach.coach.first_name} ${coach.coach.last_name}`) } }"
                    class="hover-link primary-link"
                  >
                    {{ coach.coach.first_name }} {{ coach.coach.last_name }}
                  </u-link>
                  <span v-else> {{ coach.coach.first_name }} {{ coach.coach.last_name }} </span>
                  <span> ({{ coach.years || coach.status }})</span>
                </div>
                <div v-else>—</div>
              </template>
            </dev-only>
          </div>
        </div>

        <div>
          <!--Former countries-->
          <div>Former Representations</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div v-else>
            <dev-only>
              <u-form
                v-for="(country, index) in state.countries"
                :key="index"
                :schema="PlayerUpdateSchema.shape.countries.element"
                :name="`countries.${index}`"
                nested
                class="my-1"
              >
                <u-form-field :error-pattern="/^(country|start_date|end_date)$/">
                  <u-field-group>
                    <u-select-menu
                      placeholder="Select country"
                      v-model="<any>country.country"
                      :loading="countriesPending"
                      :items="countries"
                      :icon="ICONS.globe"
                      label-key="name"
                    />
                    <u-button
                      :icon="icons.close"
                      @click="state.countries!.splice(index, 1)"
                      color="error"
                    />
                  </u-field-group>

                  <u-field-group>
                    <form-date-picker
                      :model-value="country.start_date ? parseDate(country.start_date) : undefined"
                      @update:model-value="value => (country.start_date = value?.toString() || null)"
                    />
                    <form-date-picker
                      :model-value="country.end_date ? parseDate(country.end_date) : undefined"
                      @update:model-value="value => (country.end_date = value?.toString() || null)"
                    />
                  </u-field-group>
                </u-form-field>
              </u-form>

              <u-button
                block
                @click="
                  state.countries!.push({
                    country: { id: '', name: '', alpha_2: null, continent: undefined },
                    start_date: null,
                    end_date: null
                  })
                "
                :icon="icons.plus"
                class="mt-2"
              >
                Add former representation
              </u-button>

              <template #fallback>
                <div
                  v-if="player?.countries.filter(country => country.end_date).length"
                  v-for="country in player.countries.filter(country => country.end_date)"
                  :key="country.id"
                  class="flex flex-wrap items-center gap-1 my-1"
                >
                  <country-link :country="country.country" />
                  <span
                    v-if="country.start_date && country.end_date"
                    class="text-dimmed"
                  >
                    ({{ formatDate(country.start_date, country.end_date) }})
                  </span>
                </div>
                <div v-else>—</div>
              </template>
            </dev-only>
          </div>
        </div>

        <dev-only>
          <div>
            <!--Wiki link-->
            <div>Wikipedia Link</div>
            <div v-if="pending">
              <u-skeleton class="w-full h-4" />
            </div>
            <div v-else>
              <u-form-field name="wiki_link">
                <form-textarea
                  v-model="state.wiki_link"
                  placeholder="Enter wikipedia link"
                />
              </u-form-field>
            </div>
          </div>

          <div>
            <!--Official link-->
            <div>Official Link</div>
            <div v-if="pending">
              <u-skeleton class="w-full h-4" />
            </div>
            <div v-else>
              <u-form-field name="official_link">
                <form-textarea
                  v-model="state.official_link"
                  placeholder="Enter official link"
                />
              </u-form-field>
            </div>
          </div>
        </dev-only>

        <div>
          <!--Updated at-->
          <div>Updated at</div>
          <div v-if="pending">
            <u-skeleton class="w-full h-4" />
          </div>
          <div>
            <u-badge
              v-if="player?.updated_at"
              :label="formatDateTime(player.updated_at)"
              color="success"
            />
          </div>
        </div>
      </div>
    </u-form>
  </div>
</template>
