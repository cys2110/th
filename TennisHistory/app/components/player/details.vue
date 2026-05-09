<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import { PostgrestError } from "@supabase/supabase-js"

const {
  params: { id }
} = useRoute("player")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const playerStore = usePlayerStore()
const currentYear = new Date().getFullYear()
const updatedPlayer = ref<Record<string, any>>({})
const isSaving = ref(false)

const key = computed(() => `${id}-details`)

const {
  data: player,
  pending,
  refresh
} = await useAsyncData(key, async () => {
  const { data, error } = await supabase
    .from("players")
    .select(
      `
      *,
      player_country_mapping(*, countries(*)),
      player_coach_mapping(*, people(*))
    `
    )
    .eq("id", id)
    .single()

  if (error || !data) {
    console.error("Error fetching player:", error)
    return null
  }

  const { player_country_mapping, player_coach_mapping, ...rest } = data

  return {
    ...rest,
    countries: player_country_mapping.map(mapping => ({
      start_date: mapping.start_date,
      end_date: mapping.end_date,
      id: mapping.id,
      country: mapping.countries
    })),
    coaches: player_coach_mapping.map(mapping => ({
      id: mapping.id,
      years: mapping.years,
      status: mapping.status,
      coach: mapping.people
    }))
  } as PlayerInterface
})

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

const playerAge = computed(() => {
  if (player.value?.dob) {
    return getAge(new Date(player.value.dob), player.value.dod ? new Date(player.value.dod) : undefined)
  } else {
    return "—"
  }
})

const handleSubmit = async () => {
  set(isSaving, true)

  try {
    const playerToUpdate: Partial<Record<string, any>> = {}

    for (const [key, value] of Object.entries(updatedPlayer.value)) {
      if (key === "countries") {
        const newCountries = value.filter((value: any) => !value.id)
        const oldCountries = value.filter((value: any) => value.id)
        const deletedCountries = player.value?.countries.filter(country => value.includes((v: any) => v.id === country.id)) || []

        if (newCountries.length) {
          const { error } = await supabase.from("player_country_mapping").insert(
            newCountries.map((country: any) => ({
              player_id: id,
              start_date: country.start_date?.toString() || null,
              end_date: country.end_date?.toString() || null,
              country_id: country.country_id
            }))
          )

          if (error) console.error("Error adding player countries", error)
        }

        if (oldCountries.length) {
          for (const country of oldCountries) {
            const { error } = await supabase
              .from("player_country_mapping")
              .update({ start_date: country.start_date?.toString() || null, end_date: country.end_date?.toString() || null })
              .eq("id", country.id)

            if (error) console.error("Error updating player countries", error)
          }
        }

        if (deletedCountries.length) {
          const { error } = await supabase
            .from("player_country_mapping")
            .delete()
            .in(
              "id",
              deletedCountries.map(coach => coach.id)
            )

          if (error) console.error("Error deleting player countries", error)
        }
      } else if (key === "coaches") {
        const newCoaches = value.filter((value: any) => !value.id)
        const oldCoaches = value.filter((value: any) => value.id)
        const deletedCoaches = player.value?.coaches.filter(coach => value.includes((v: any) => v.id === coach.id)) || []

        if (newCoaches.length) {
          const { error } = await supabase.from("player_coach_mapping").insert(
            newCoaches.map((coach: any) => ({
              player_id: id,
              coach_id: coach.coach_id,
              years: coach.years,
              status: coach.status
            }))
          )

          if (error) console.error("Error adding player coaches", error)
        }

        if (oldCoaches.length) {
          for (const coach of oldCoaches) {
            const { error } = await supabase.from("player_coach_mapping").update({ years: coach.years, status: coach.status }).eq("id", coach.id)

            if (error) console.error("Error updating player coaches", error)
          }
        }

        if (deletedCoaches.length) {
          const { error } = await supabase
            .from("player_coach_mapping")
            .delete()
            .in(
              "id",
              deletedCoaches.map(coach => coach.id)
            )

          if (error) console.error("Error deleting player coaches", error)
        }
      } else if (["dob", "dod"].includes(key)) {
        playerToUpdate[key] = value?.toString() || null
      } else {
        playerToUpdate[key] = value
      }
    }

    const { error } = await supabase
      .from("players")
      // @ts-expect-error
      .update({ ...playerToUpdate })
      .eq("id", id)

    if (error) throw error

    toast.add({
      title: `${player.value?.first_name || updatedPlayer.value.first_name} ${player.value?.last_name || updatedPlayer.value.last_name} successfully updated!`,
      icon: icons.success,
      color: "success"
    })
    set(updatedPlayer, {})
    reloadNuxtApp()
  } catch (error) {
    console.error(error)

    toast.add({
      title: `Error updating ${playerStore.fullName}`,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(isSaving, false)
  }
}
</script>

<template>
  <div class="flex justify-end mb-6">
    <u-field-group class="w-fit">
      <u-button
        :icon="icons.reload"
        @click="refresh()"
      />

      <u-button
        :icon="isSaving ? ICONS.uploading : ICONS.save"
        @click="handleSubmit"
        :disabled="isSaving || Object.keys(updatedPlayer).length === 0"
      />
    </u-field-group>
  </div>

  <div
    class="flex-1 lg:divide-y divide-default text-sm rounded-md overflow-hidden *:grid *:grid-cols-2 *:divide-y *:divide-default *:lg:divide-none *:lg:grid-cols-4 *:*:odd:bg-elevated *:*:odd:dark:bg-muted/50 *:*:px-4 *:*:py-1 *:*:even:font-medium *:*:even:text-muted"
  >
    <dev-only>
      <div>
        <div>Name</div>
        <div v-if="pending">
          <u-skeleton class="w-full h-4" />
        </div>
        <div
          v-else
          class="flex items-center gap-2"
        >
          <u-field-group v-if="'first_name' in updatedPlayer && 'last_name' in updatedPlayer">
            <form-input
              v-model="updatedPlayer.first_name"
              placeholder="First name"
            />

            <form-input
              v-model="updatedPlayer.last_name"
              placeholder="Last name"
            />
          </u-field-group>

          <div
            v-else
            class="flex-1"
          >
            {{ player?.first_name }} {{ player?.last_name }}
          </div>

          <u-checkbox
            :icon="ICONS.racquet"
            :model-value="'first_name' in updatedPlayer && 'last_name' in updatedPlayer"
            @update:model-value="
              () => {
                if ('first_name' in updatedPlayer) {
                  delete updatedPlayer['first_name']
                  delete updatedPlayer['last_name']
                } else {
                  updatedPlayer['first_name'] = player?.first_name
                  updatedPlayer['last_name'] = player?.last_name
                }
              }
            "
          />
        </div>

        <div>Updated at</div>
        <div v-if="pending">
          <u-skeleton class="w-full h-4" />
        </div>
        <div v-else>
          <u-badge
            v-if="player?.updated_at"
            :label="formatDateTime(player.updated_at)"
            color="success"
          />
        </div>
      </div>
    </dev-only>

    <div>
      <div>Country</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div v-else>
        <country-link
          v-if="player?.countries.find(country => !country.end_date)"
          :country="player.countries.find(country => !country.end_date)!.country"
        />
        <div v-else>—</div>
      </div>

      <div>Height</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="flex items-center gap-2"
      >
        <u-field-group v-if="'height' in updatedPlayer">
          <form-input-number
            v-model="updatedPlayer.height"
            placeholder="Height"
          />
          <u-badge
            label="cm"
            color="neutral"
            variant="outline"
          />
        </u-field-group>

        <div
          v-else
          class="flex-1"
        >
          <div>{{ player?.height ? `${player.height} cm` : "—" }}</div>
          <div v-if="player?.height">{{ convertToFt(player.height) }}</div>
        </div>

        <u-checkbox
          :icon="ICONS.racquet"
          :model-value="'height' in updatedPlayer"
          @update:model-value="
            () => {
              if ('height' in updatedPlayer) {
                delete updatedPlayer['height']
              } else {
                updatedPlayer['height'] = player?.height
              }
            }
          "
        />
      </div>
    </div>

    <div>
      <div>Age</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="flex items-center gap-2"
      >
        <u-field-group v-if="'dob' in updatedPlayer && 'dod' in updatedPlayer">
          <form-date-picker
            v-model="updatedPlayer.dob"
            placeholder="Date of birth"
          />

          <form-date-picker
            v-model="updatedPlayer.dod"
            placeholder="Date of death"
          />
        </u-field-group>

        <div
          v-else
          class="flex-1"
        >
          <div>{{ playerAge }}</div>
          <div v-if="player?.dob">
            {{ formatDate(player.dob, player?.dod || undefined) }}
          </div>
          <div v-else-if="player?.dod">
            {{ formatDate(player.dod) }}
          </div>
        </div>

        <u-checkbox
          :icon="ICONS.racquet"
          :model-value="'dob' in updatedPlayer && 'dod' in updatedPlayer"
          @update:model-value="
            () => {
              if ('dob' in updatedPlayer) {
                delete updatedPlayer['dob']
                delete updatedPlayer['dod']
              } else {
                updatedPlayer['dob'] = player?.dob ? parseDate(player.dob) : null
                updatedPlayer['dod'] = player?.dod ? parseDate(player.dod) : null
              }
            }
          "
        />
      </div>

      <div>
        {{
          player?.turned_pro && !player.retired ? "Turned Pro"
          : player?.retired && !player.turned_pro ? "Retired"
          : "Pro Years"
        }}
      </div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="flex items-center gap-2"
      >
        <u-field-group v-if="'turned_pro' in updatedPlayer && 'retired' in updatedPlayer">
          <form-input-number
            v-model="updatedPlayer.turned_pro"
            placeholder="Turned pro"
          />

          <form-input-number
            v-model="updatedPlayer.retired"
            placeholder="Retired"
          />
        </u-field-group>

        <div
          v-else
          class="flex-1"
        >
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
        </div>

        <u-checkbox
          :icon="ICONS.racquet"
          :model-value="'turned_pro' in updatedPlayer && 'retired' in updatedPlayer"
          @update:model-value="
            () => {
              if ('turned_pro' in updatedPlayer) {
                delete updatedPlayer['turned_pro']
                delete updatedPlayer['retired']
              } else {
                updatedPlayer['turned_pro'] = player?.turned_pro
                updatedPlayer['retired'] = player?.retired
              }
            }
          "
        />
      </div>
    </div>

    <div>
      <div>Plays</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="flex items-center gap-2"
      >
        <u-radio-group
          v-if="'rh' in updatedPlayer"
          v-model="updatedPlayer.rh"
          :items="['Right', 'Left']"
          orientation="horizontal"
          loop
          class="flex-1"
        />

        <div
          v-else
          class="flex-1"
          >{{ player?.rh ? `${player.rh}-handed` : "—" }}</div
        >

        <u-checkbox
          :icon="ICONS.racquet"
          :model-value="'rh' in updatedPlayer"
          @update:model-value="
            () => {
              if ('rh' in updatedPlayer) {
                delete updatedPlayer['rh']
              } else {
                updatedPlayer['rh'] = player?.rh
              }
            }
          "
        />
      </div>

      <div>Backhand</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="flex items-center gap-2"
      >
        <u-radio-group
          v-if="'bh' in updatedPlayer"
          v-model="updatedPlayer.bh"
          :items="['One', 'Two']"
          orientation="horizontal"
          loop
          class="flex-1"
        />

        <div
          v-else
          class="flex-1"
          >{{ player?.bh ? `${player.bh}-handed` : "—" }}</div
        >

        <u-checkbox
          :icon="ICONS.racquet"
          :model-value="'bh' in updatedPlayer"
          @update:model-value="
            () => {
              if ('bh' in updatedPlayer) {
                delete updatedPlayer['bh']
              } else {
                updatedPlayer['bh'] = player?.bh
              }
            }
          "
        />
      </div>
    </div>

    <div>
      <div>Current Singles Ranking</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div v-else>
        {{ player?.current_singles?.toLocaleString() ?? "—" }}
      </div>

      <div>Current Doubles Ranking</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div v-else>
        {{ player?.current_doubles?.toLocaleString() ?? "—" }}
      </div>
    </div>

    <div>
      <div>Career High Singles Ranking</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div v-else>
        <div>{{ player?.ch_singles?.toLocaleString() ?? "—" }}</div>
        <div v-if="player?.ch_singles_date">
          {{ formatDate(player.ch_singles_date) }}
        </div>
      </div>

      <div>Career High Doubles Ranking</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div v-else>
        <div>{{ player?.ch_doubles?.toLocaleString() ?? "—" }}</div>
        <div v-if="player?.ch_doubles_date">
          {{ formatDate(player.ch_doubles_date) }}
        </div>
      </div>
    </div>

    <div>
      <div>Prize Money</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div v-else>
        {{ isDefined(player?.pm) ? player.pm.toLocaleString("en-GB", { style: "currency", currency: "USD" }) : "—" }}
      </div>

      <div>Hall of Fame Induction</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="flex items-center gap-2"
      >
        <form-input-number
          v-if="'hof' in updatedPlayer"
          v-model="updatedPlayer.hof"
          placeholder="Hall of Fame induction"
        />

        <div
          v-else
          class="flex-1"
        >
          {{ player?.hof || "—" }}
        </div>

        <u-checkbox
          :icon="ICONS.racquet"
          :model-value="'hof' in updatedPlayer"
          @update:model-value="
            () => {
              if ('hof' in updatedPlayer) {
                delete updatedPlayer['hof']
              } else {
                updatedPlayer['hof'] = player?.hof
              }
            }
          "
        />
      </div>
    </div>

    <dev-only>
      <div>
        <div>Wikipedia Link</div>
        <div v-if="pending">
          <u-skeleton class="w-full h-4" />
        </div>
        <div
          v-else
          class="flex items-center gap-2"
        >
          <form-textarea
            v-if="'wiki_link' in updatedPlayer"
            v-model="updatedPlayer.wiki_link"
            placeholder="Wikipedia link"
          />

          <div
            v-else
            class="flex-1"
          >
            {{ player?.wiki_link || "—" }}
          </div>

          <u-checkbox
            :icon="ICONS.racquet"
            :model-value="'wiki_link' in updatedPlayer"
            @update:model-value="
              () => {
                if ('wiki_link' in updatedPlayer) {
                  delete updatedPlayer['wiki_link']
                } else {
                  updatedPlayer['wiki_link'] = player?.wiki_link
                }
              }
            "
          />
        </div>

        <div>Official Link</div>
        <div v-if="pending">
          <u-skeleton class="w-full h-4" />
        </div>
        <div
          v-else
          class="flex items-center gap-2"
        >
          <form-textarea
            v-if="'official_link' in updatedPlayer"
            v-model="updatedPlayer.official_link"
            placeholder="Official link"
          />

          <div
            v-else
            class="flex-1"
          >
            {{ player?.official_link || "—" }}
          </div>

          <u-checkbox
            :icon="ICONS.racquet"
            :model-value="'official_link' in updatedPlayer"
            @update:model-value="
              () => {
                if ('official_link' in updatedPlayer) {
                  delete updatedPlayer['official_link']
                } else {
                  updatedPlayer['official_link'] = player?.official_link
                }
              }
            "
          />
        </div>
      </div>
    </dev-only>

    <div>
      <div :class="{ 'col-span-2': 'coaches' in updatedPlayer || 'countries' in updatedPlayer }">Coaches</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="flex items-center gap-2"
        :class="{ 'col-span-2': 'coaches' in updatedPlayer || 'countries' in updatedPlayer }"
      >
        <div
          v-if="'coaches' in updatedPlayer"
          class="flex-1 *:my-0.5"
        >
          <u-field-group v-for="(coach, index) in updatedPlayer.coaches">
            <person-search
              v-model="updatedPlayer.coaches[index].coach_id"
              placeholder="Select coach"
              :icon="ICONS.coach"
              :start-value="
                coach.coach_id ?
                  {
                    id: coach.coach_id,
                    label: coach.label
                  }
                : undefined
              "
            />

            <form-input
              v-model="updatedPlayer.coaches[index].years"
              placeholder="Years"
            />

            <u-select
              v-model="updatedPlayer.coaches[index].status"
              :items="['Current', 'Former']"
            />

            <u-button
              :icon="icons.close"
              @click="updatedPlayer.coaches.splice(index, 1)"
              color="error"
            />
          </u-field-group>

          <u-button
            :icon="icons.plus"
            label="Add Coach"
            block
            @click="
              updatedPlayer.coaches.push({
                years: undefined,
                status: 'Current',
                coach_id: undefined,
                label: undefined
              })
            "
          />
        </div>

        <div
          v-else
          class="flex-1"
        >
          <div
            v-if="player?.coaches.length"
            v-for="coach in player.coaches"
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
        </div>

        <u-checkbox
          :icon="ICONS.racquet"
          :model-value="'coaches' in updatedPlayer"
          @update:model-value="
            () => {
              if ('coaches' in updatedPlayer) {
                delete updatedPlayer['coaches']
              } else {
                updatedPlayer['coaches'] =
                  player?.coaches?.map(coach => ({
                    id: coach.id,
                    years: coach.years,
                    status: coach.status,
                    coach_id: coach.coach.id,
                    label: `${coach.coach.first_name} ${coach.coach.last_name}`
                  })) || []
              }
            }
          "
        />
      </div>

      <div :class="{ 'col-span-2': 'coaches' in updatedPlayer || 'countries' in updatedPlayer }">Previous Representations</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="flex items-center gap-2"
        :class="{ 'col-span-2': 'coaches' in updatedPlayer || 'countries' in updatedPlayer }"
      >
        <div
          v-if="'countries' in updatedPlayer"
          class="flex-1 *:my-0.5"
        >
          <u-field-group v-for="(country, index) in updatedPlayer.countries">
            <u-input-menu
              v-model="updatedPlayer.countries[index].country_id"
              :items="countries"
              :icon="ICONS.globe"
              :loading="countriesPending"
              label-key="name"
              value-key="id"
              placeholder="Country"
              class="w-full"
            />

            <form-date-picker v-model="updatedPlayer.countries[index].start_date" />

            <form-date-picker v-model="updatedPlayer.countries[index].end_date" />

            <u-button
              :icon="icons.close"
              @click="updatedPlayer.countries.splice(index, 1)"
              color="error"
            />
          </u-field-group>

          <u-button
            :icon="icons.plus"
            label="Add Country"
            block
            @click="
              updatedPlayer.countries.push({
                start_date: undefined,
                end_date: undefined,
                country_id: undefined
              })
            "
          />
        </div>

        <div
          v-else
          class="flex-1"
        >
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
        </div>

        <u-checkbox
          :icon="ICONS.racquet"
          :model-value="'countries' in updatedPlayer"
          @update:model-value="
            () => {
              if ('countries' in updatedPlayer) {
                delete updatedPlayer['countries']
              } else {
                updatedPlayer['countries'] =
                  player?.countries?.map(country => ({
                    id: country.id,
                    start_date: country.start_date ? parseDate(country.start_date) : undefined,
                    end_date: country.end_date ? parseDate(country.end_date) : undefined,
                    country_id: country.country.id
                  })) || []
              }
            }
          "
        />
      </div>
    </div>
  </div>
</template>
