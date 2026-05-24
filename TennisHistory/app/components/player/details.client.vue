<script setup lang="ts">
import { parseDate } from "@internationalized/date"

const {
  params: { id }
} = useRoute("player")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const { isAdmin } = useAuthState()
const playerStore = usePlayerStore()
const { countries, pending: countriesPending } = useCountryList()

const currentYear = new Date().getFullYear()
const updatedPlayer = ref<Record<string, any>>({})
const isSaving = ref(false)

const key = computed(() => `${id}-details`)

// TODO: Add win-loss and titles
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
    return
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
  } as Omit<PlayerInterface, "first_tournament" | "last_tournament" | "country">
})

const playerAge = computed(() => {
  if (player.value?.dob) {
    return getAge(new Date(player.value.dob), player.value.dod ? new Date(player.value.dod) : undefined)
  } else {
    return "—"
  }
})

const handleCheckboxSelect = (fields: (keyof Omit<PlayerInterface, "first_tournament" | "last_tournament" | "country">)[]) => {
  for (const field of fields) {
    if (field in updatedPlayer.value) {
      delete updatedPlayer.value[field]
    } else {
      if (field === "dob" || field === "dod") {
        updatedPlayer.value[field] = player.value?.[field] ? parseDate(player.value[field]) : undefined
      } else if (field === "countries") {
        updatedPlayer.value[field] =
          player.value?.countries?.map(country => ({
            id: country.id,
            start_date: country.start_date ? parseDate(country.start_date) : undefined,
            end_date: country.end_date ? parseDate(country.end_date) : undefined,
            country_id: country.country.id
          })) || []
      } else if (field === "coaches") {
        updatedPlayer.value[field] =
          player.value?.coaches?.map(coach => ({
            id: coach.id,
            years: coach.years,
            status: coach.status,
            coach_id: {
              id: coach.coach.id,
              full_name: coach.coach.full_name
            }
          })) || []
      } else {
        updatedPlayer.value[field] = player.value?.[field]
      }
    }
  }
}

const handleSubmit = async () => {
  set(isSaving, true)

  try {
    const playerToUpdate: Record<string, any> = {}

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
        const deletedCoaches = player.value?.coaches.filter(coach => value.includes((v: any) => v.id && v.id === coach.id)) || []

        if (newCoaches.length) {
          const { error } = await supabase.from("player_coach_mapping").insert(
            newCoaches.map((coach: any) => ({
              player_id: id,
              coach_id: coach.coach_id.id,
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
  <div
    v-if="isAdmin"
    class="flex justify-end mb-6"
  >
    <u-field-group class="w-fit">
      <u-button
        :icon="icons.reload"
        @click="refresh()"
      />

      <u-button
        :icon="ICONS.save"
        :loading="isSaving"
        :loading-icon="ICONS.uploading"
        @click="handleSubmit"
        :disabled="isSaving || Object.keys(updatedPlayer).length === 0"
      />
    </u-field-group>
  </div>

  <div
    class="flex-1 lg:divide-y divide-default text-sm rounded-md overflow-hidden *:grid *:grid-cols-2 *:divide-y *:divide-default *:lg:divide-none *:lg:grid-cols-4 *:*:px-4 *:*:py-1 *:*:odd:bg-elevated *:*:odd:dark:bg-muted/50 *:*:even:font-medium *:*:even:text-muted [&_.detail]:flex [&_.detail]:items-center [&_.detail]:gap-2 [&_.detail]:*:first:flex-1"
  >
    <div v-if="isAdmin">
      <div>Name</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="detail"
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
        <div v-else>{{ player?.full_name }}</div>
        <u-checkbox
          highlight
          :icon="ICONS.player"
          :model-value="'first_name' in updatedPlayer && 'last_name' in updatedPlayer"
          @update:model-value="() => handleCheckboxSelect(['first_name', 'last_name'])"
        />
      </div>

      <div>Links</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="detail"
      >
        <div v-if="'wiki_link' in updatedPlayer && 'official_link' in updatedPlayer">
          <form-textarea
            v-model="updatedPlayer.wiki_link"
            placeholder="Wikipedia link"
          />

          <form-textarea
            v-model="updatedPlayer.official_link"
            placeholder="Official link"
          />
        </div>

        <div v-else>
          <div class="truncate text-ellipsis">
            {{ player?.wiki_link || "—" }}
          </div>
          <div class="truncate text-ellipsis">
            {{ player?.official_link || "—" }}
          </div>
        </div>

        <u-checkbox
          highlight
          :icon="ICONS.player"
          :model-value="'wiki_link' in updatedPlayer && 'official_link' in updatedPlayer"
          @update:model-value="() => handleCheckboxSelect(['wiki_link', 'official_link'])"
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
        class="detail"
      >
        <u-field-group v-if="'dob' in updatedPlayer && 'dod' in updatedPlayer">
          <form-date-picker
            v-model="updatedPlayer.dob"
            :show-icons="false"
          />

          <form-date-picker
            v-model="updatedPlayer.dod"
            :show-icons="false"
          />
        </u-field-group>

        <div v-else>
          <div>{{ playerAge }}</div>
          <div v-if="player?.dob">
            {{ formatDate(player.dob, player?.dod || undefined) }}
          </div>
          <div v-else-if="player?.dod">
            {{ formatDate(player.dod) }}
          </div>
        </div>

        <u-checkbox
          highlight
          v-if="isAdmin"
          :model-value="'dob' in updatedPlayer && 'dod' in updatedPlayer"
          @update:model-value="() => handleCheckboxSelect(['dob', 'dod'])"
        />
      </div>

      <div>{{
        player?.turned_pro && !player.retired ? "Turned Pro"
        : player?.retired && !player.turned_pro ? "Retired"
        : "Pro Years"
      }}</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="detail"
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

        <div v-else>
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
          highlight
          v-if="isAdmin"
          :model-value="'turned_pro' in updatedPlayer && 'retired' in updatedPlayer"
          @update:model-value="() => handleCheckboxSelect(['turned_pro', 'retired'])"
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
        class="detail"
      >
        <u-radio-group
          v-if="'rh' in updatedPlayer"
          v-model="updatedPlayer.rh"
          :items="['Right', 'Left']"
          orientation="horizontal"
          loop
        />
        <div v-else>{{ player?.rh ? `${player.rh}-handed` : "—" }}</div>
        <u-checkbox
          highlight
          v-if="isAdmin"
          :icon="ICONS.player"
          :model-value="'rh' in updatedPlayer"
          @update:model-value="() => handleCheckboxSelect(['rh'])"
        />
      </div>

      <div>Backhand</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="detail"
      >
        <u-radio-group
          v-if="'bh' in updatedPlayer"
          v-model="updatedPlayer.bh"
          :items="['Right', 'Left']"
          orientation="horizontal"
          loop
        />
        <div v-else>{{ player?.bh ? `${player.bh}-handed` : "—" }}</div>
        <u-checkbox
          highlight
          v-if="isAdmin"
          :icon="ICONS.player"
          :model-value="'bh' in updatedPlayer"
          @update:model-value="() => handleCheckboxSelect(['bh'])"
        />
      </div>
    </div>

    <div>
      <div>Height</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="detail"
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
        <div v-else>
          <div>{{ player?.height ? `${player.height} cm` : "—" }}</div>
          <div v-if="player?.height">{{ convertToFt(player.height) }}</div>
        </div>
        <u-checkbox
          highlight
          v-if="isAdmin"
          :icon="ICONS.player"
          :model-value="'height' in updatedPlayer"
          @update:model-value="() => handleCheckboxSelect(['height'])"
        />
      </div>

      <div>Prize Money</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div v-else>
        {{ isDefined(player?.pm) ? player.pm.toLocaleString("en-GB", { style: "currency", currency: "USD" }) : "—" }}
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
        <div>
          <div>{{ player?.ch_singles?.toLocaleString() ?? "—" }}</div>
          <div v-if="player?.ch_singles_date">
            {{ formatDate(player.ch_singles_date) }}
          </div>
        </div>
      </div>

      <div>Career High Doubles Ranking</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div v-else>
        <div>
          <div>{{ player?.ch_doubles?.toLocaleString() ?? "—" }}</div>
          <div v-if="player?.ch_doubles_date">
            {{ formatDate(player.ch_doubles_date) }}
          </div>
        </div>
      </div>
    </div>

    <div>
      <div>Hall of Fame Induction</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="detail"
      >
        <form-input
          v-if="'hof' in updatedPlayer"
          type="number"
          placeholder="Hall of fame induction"
        />

        <div v-else>{{ player?.hof || "—" }}</div>

        <u-checkbox
          highlight
          v-if="isAdmin"
          :icon="ICONS.player"
          :model-value="'hof' in updatedPlayer"
          @update:model-value="() => handleCheckboxSelect(['hof'])"
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

    <div>
      <div :class="{ 'col-span-2': 'coaches' in updatedPlayer || 'countries' in updatedPlayer }">Coaches</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="detail"
        :class="{ 'col-span-2': 'coaches' in updatedPlayer || 'countries' in updatedPlayer }"
      >
        <div
          v-if="'coaches' in updatedPlayer"
          class="*:my-0.5"
        >
          <u-field-group v-for="(coach, index) in updatedPlayer.coaches">
            <person-search
              v-model="updatedPlayer.coaches[index].coach_id"
              placeholder="Select coach"
              :icon="ICONS.coach"
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
                full_name: undefined
              })
            "
          />
        </div>

        <div v-else>
          <div
            v-if="player?.coaches.length"
            v-for="coach in player.coaches"
            :key="coach.id"
          >
            <u-link
              v-if="coach.coach.player_id"
              :to="{ name: 'player', params: { id: coach.id, name: kebabCase(coach.coach.full_name) } }"
              class="hover-link primary-link"
            >
              {{ coach.coach.full_name }}
            </u-link>
            <span v-else> {{ coach.coach.full_name }} </span>
            <span> ({{ coach.years || coach.status }})</span>
          </div>
          <div v-else>—</div>
        </div>

        <u-checkbox
          highlight
          v-if="isAdmin"
          :icon="ICONS.player"
          :model-value="'coaches' in updatedPlayer"
          @update:model-value="() => handleCheckboxSelect(['coaches'])"
        />
      </div>

      <div :class="{ 'col-span-2': 'coaches' in updatedPlayer || 'countries' in updatedPlayer }">{{
        "countries" in updatedPlayer ? "Countries" : "Previous Representations"
      }}</div>
      <div v-if="pending">
        <u-skeleton class="w-full h-4" />
      </div>
      <div
        v-else
        class="detail"
        :class="{ 'col-span-2': 'coaches' in updatedPlayer || 'countries' in updatedPlayer }"
      >
        <div
          v-if="'countries' in updatedPlayer"
          class="*:my-0.5"
        >
          <u-field-group v-for="(_, index) in updatedPlayer.countries">
            <country-search
              v-model="updatedPlayer.countries[index].country_id"
              value-key
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

        <div v-else>
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
          highlight
          v-if="isAdmin"
          :icon="ICONS.player"
          :model-value="'countries' in updatedPlayer"
          @update:model-value="() => handleCheckboxSelect(['countries'])"
        />
      </div>
    </div>
  </div>
</template>
