<script setup lang="ts">
import { coachSchema, ICONS, nationalitySchema, playerSchema, prettifyJson } from "#imports"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import type { Tables } from "~/types/database.types"
import { playerInitialState } from "../utils"
import { CalendarDate, parseDate } from "@internationalized/date"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const { countries } = useCountryList()

const state = ref<Partial<PlayerInputSchema>>({ ...playerInitialState })
const isUpdating = ref(false)
const response = ref()
const errors = ref<Array<{ type: string; details: any }>>([])

const selectedPlayer = ref<PlayerType>()
const startingPlayerDetails = ref<Partial<PlayerInputSchema>>()
const startingCoaches = ref<Tables<{ schema: "tennis" }, "player_coach_mapping">[]>([])
const startingNationalities = ref<Tables<{ schema: "tennis" }, "prev_nationality_mapping">[]>([])

const handlePlayerSelection = async () => {
  if (selectedPlayer.value) {
    const { data, error } = await supabase
      .schema("tennis")
      .from("player")
      .select(
        `
        *,
        people(*),
        player_coach_mapping(*, coach:people(id, full_name, country!nationality_id(*))),
        prev_nationality_mapping(*, country(*))
      `
      )
      .eq("id", selectedPlayer.value.id)
      .single()

    if (error || !data) {
      errors.value.push({
        type: "Error fetching player details",
        details: error
      })
      return
    }

    const { people, player_coach_mapping, prev_nationality_mapping, ...rest } = data
    startingCoaches.value = player_coach_mapping.map(({ coach, ...mapping }) => mapping)
    startingNationalities.value = prev_nationality_mapping.map(({ country, ...mapping }) => mapping)

    const playerDetails = {
      ...playerInitialState,
      ...rest,
      ...people,
      id: rest.id,
      dob: people.dob ? parseDate(people.dob) : undefined,
      dod: people.dod ? parseDate(people.dod) : undefined,
      hof: rest.hof != null ? new CalendarDate(rest.hof, 1, 1) : undefined,
      retired: rest.retired != null ? new CalendarDate(rest.retired, 1, 1) : undefined,
      turned_pro: rest.turned_pro != null ? new CalendarDate(rest.turned_pro, 1, 1) : undefined,
      nationality_id: people.nationality_id as string,
      birth_country_id: people.birth_country_id as string,
      coaches: player_coach_mapping.map(pcm => ({
        id: pcm.id,
        person: {
          id: pcm.coach_id,
          full_name: pcm.coach.full_name,
          icon: pcm.coach.country?.icon
        },
        years: pcm.years,
        status: pcm.status
      })),
      prev_nationalities: prev_nationality_mapping.map(pnm => ({
        id: pnm.id,
        country_id: pnm.country_id,
        start_date: pnm.start_date ? parseDate(pnm.start_date) : null,
        end_date: pnm.end_date ? parseDate(pnm.end_date) : null
      }))
    }

    state.value = {
      ...playerInitialState,
      ...playerDetails
    }

    set(startingPlayerDetails, { ...playerDetails })
  }
}

watch(selectedPlayer, () => handlePlayerSelection())

const handleReset = () => {
  set(errors, [])
  set(selectedPlayer, null)
  set(state, { ...playerInitialState })
  set(startingCoaches, [])
  set(startingNationalities, [])
}

const onError = (event: FormErrorEvent) => {
  errors.value.push({
    type: "Validation",
    details: event.errors
  })
}

const onSubmit = async (event: FormSubmitEvent<PlayerSchema>) => {
  set(isUpdating, true)
  set(response, null)
  set(errors, [])

  try {
    const personId = startingPlayerDetails.value?.person_id
    if (!personId) {
      errors.value.push({ type: "Error updating player", details: "Select a player first." })
      return
    }
    // Image
    let image_url: string | undefined
    if (event.data.image) {
      if (startingPlayerDetails.value?.image_url) {
        const { error: deleteError } = await supabase.storage.from("tennis").remove([`players/${event.data.id}`])

        if (deleteError) {
          errors.value.push({
            type: "Error deleting player image",
            details: deleteError
          })
          return
        }
      }

      // Upload to storage if a logo is selected
      const { data, error } = await supabase.storage.from("tennis").upload(`players/${event.data.id}`, event.data.image, {
        cacheControl: "3600",
        upsert: true
      })

      if (error || !data) {
        errors.value.push({
          type: "Error uploading player image",
          details: error
        })

        return
      }

      const { data: publicUrlData } = supabase.storage.from("tennis").getPublicUrl(data.path)

      image_url = publicUrlData.publicUrl
    }

    const { error: personError } = await supabase
      .schema("tennis")
      .from("people")
      .update({
        first_name: event.data.first_name,
        last_name: event.data.last_name,
        dob: event.data.dob?.toString(),
        dod: event.data.dod?.toString(),
        nationality_id: event.data.nationality_id,
        birth_place: event.data.birth_place,
        birth_country_id: event.data.birth_country_id
      })
      .eq("id", personId)

    if (personError) {
      errors.value.push({
        type: "Error updating person",
        details: personError
      })
      return
    }

    const { data: playerData, error: playerInsertError } = await supabase
      .schema("tennis")
      .from("player")
      .update({
        bh: event.data.bh,
        height: event.data.height,
        hof: event.data.hof?.year,
        official_link: event.data.official_link,
        pm: event.data.pm,
        retired: event.data.retired?.year,
        rh: event.data.rh,
        turned_pro: event.data.turned_pro?.year,
        image_url: image_url ?? event.data.image_url
      })
      .eq("id", event.data.id)
      .select("*, ...people(full_name, nationality_id)")

    if (playerInsertError) {
      errors.value.push({
        type: "Error updating player",
        details: playerInsertError
      })
      return
    }

    for (const [index, coach] of event.data.coaches.entries()) {
      if (!coach.person?.id) {
        errors.value.push({ type: "Error saving coach", details: "Select a person for each coach." })
        return
      }

      const original = startingCoaches.value.find(row => row.id === coach.id)
      if (coach.id !== undefined && !original) {
        errors.value.push({ type: "Error saving coach", details: "Reload the player before editing this coach." })
        return
      }
      const values = { coach_id: coach.person.id, years: coach.years ?? null, status: coach.status }
      if (original && original.coach_id === values.coach_id && original.years === values.years && original.status === values.status) continue

      const table = supabase.schema("tennis").from("player_coach_mapping")
      const query =
        original ? table.update(values).eq("id", original.id).eq("player_id", event.data.id) : table.insert({ ...values, player_id: event.data.id })
      const { data, error } = await query.select().single()
      if (error) {
        errors.value.push({ type: "Error saving coach", details: error })
        return
      }

      coach.id = data.id
      if (state.value.coaches?.[index]) state.value.coaches[index]!.id = data.id
      startingCoaches.value = [...startingCoaches.value.filter(row => row.id !== data.id), data]
    }

    for (const [index, nationality] of event.data.prev_nationalities.entries()) {
      if (!nationality.start_date || !nationality.end_date) {
        errors.value.push({ type: "Error saving previous nationality", details: "Start and end dates are required." })
        return
      }

      const original = startingNationalities.value.find(row => row.id === nationality.id)
      if (nationality.id !== undefined && !original) {
        errors.value.push({ type: "Error saving previous nationality", details: "Reload the player before editing this nationality." })
        return
      }
      const values = {
        country_id: nationality.country_id,
        start_date: nationality.start_date.toString(),
        end_date: nationality.end_date.toString()
      }
      if (original && original.country_id === values.country_id && original.start_date === values.start_date && original.end_date === values.end_date)
        continue

      const table = supabase.schema("tennis").from("prev_nationality_mapping")
      const query =
        original ? table.update(values).eq("id", original.id).eq("player_id", event.data.id) : table.insert({ ...values, player_id: event.data.id })
      const { data, error } = await query.select().single()
      if (error) {
        errors.value.push({ type: "Error saving previous nationality", details: error })
        return
      }

      nationality.id = data.id
      if (state.value.prev_nationalities?.[index]) state.value.prev_nationalities[index]!.id = data.id
      startingNationalities.value = [...startingNationalities.value.filter(row => row.id !== data.id), data]
    }

    handleReset()
    set(response, playerData[0])
  } finally {
    set(isUpdating, false)
  }
}

const handleScrape = async () => {
  try {
    const response = await fetch(`/api/update-player?id=${state.value.id}`)

    const data = await response.json()
    const { birthCountry, country, dob, turned_pro, ...rest } = data

    state.value = {
      ...state.value,
      ...rest
    }

    if (dob) state.value.dob = parseDate(dob)

    if (country) state.value.nationality_id = countries.value.find(c => c.name === country)?.id
    if (birthCountry) state.value.birth_country_id = countries.value.find(c => c.name === birthCountry)?.id

    if (turned_pro) state.value.turned_pro = parseDate(`${turned_pro}-01-01`)
  } catch (error) {
    errors.value.push({
      type: "Error scraping player",
      details: error
    })
  }
}

const handleScrapeRankings = async () => {
  try {
    const result = await $fetch("/api/scrape-rankings", { query: { id: state.value.id } })

    if (!result.success) {
      errors.value.push({
        type: "Error scraping rankings",
        details: result.error
      })
    }
  } catch (error) {
    errors.value.push({
      type: "Error scraping rankings",
      details: error
    })
  }
}
</script>

<template>
  <div class="flex gap-6 items-start">
    <u-card class="basis-2/3">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="font-semibold">Update {{ state.first_name && state.last_name ? `${state.first_name} ${state.last_name}` : "Player" }}</div>

          <u-field-group>
            <u-button
              :icon="ICONS.download"
              label="Scrape"
              :disabled="!state.id"
              @click="handleScrape"
            />

            <u-button
              :icon="ICONS.ranking"
              label="Rankings"
              :disabled="!state.id"
              @click="handleScrapeRankings"
            />
          </u-field-group>
        </div>
      </template>

      <player-search
        v-model="selectedPlayer"
        class="mb-6"
      />

      <u-form
        id="update-form"
        :schema="playerSchema"
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-6"
      >
        <div class="grid grid-cols-3 gap-6">
          <u-form-field
            label="Profile Picture"
            name="image"
            class="col-span-3"
          >
            <u-file-upload
              v-model="state.image"
              accept="image/*"
              :label="state.image_url ? 'Drop a replacement image here' : 'Drop your image here'"
            >
              <template
                v-if="state.image_url"
                #leading
              >
                <img
                  :src="state.image_url"
                  alt="Current profile picture"
                  class="h-48 w-full object-contain"
                />
              </template>
            </u-file-upload>
          </u-form-field>

          <div class="space-y-6">
            <u-form-field
              label="Nationality"
              key="nationality_id"
              required
            >
              <country-listbox v-model="state.nationality_id" />
            </u-form-field>

            <form-field
              v-model="state"
              :field="{
                label: 'Birth Place',
                key: 'birth_place',
                type: 'text'
              }"
            />

            <u-form-field
              label="Birth Country"
              key="birth_country_id"
              required
            >
              <country-listbox v-model="state.birth_country_id" />
            </u-form-field>
          </div>

          <div class="col-span-2 grid grid-cols-2 gap-6">
            <form-field
              v-model="state"
              :field="{
                label: 'First Name',
                key: 'first_name',
                type: 'text',
                required: true
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Last Name',
                key: 'last_name',
                type: 'text',
                required: true
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Date of Birth',
                key: 'dob',
                type: 'date'
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Date of Death',
                key: 'dod',
                type: 'date'
              }"
            />

            <u-form-field
              label="Height"
              name="height"
            >
              <u-field-group>
                <form-input-number
                  v-model="<number>state.height"
                  placeholder="Height"
                />
                <u-input
                  default-value="cm"
                  disabled
                  :ui="{ base: 'disabled:cursor-default' }"
                />
              </u-field-group>
            </u-form-field>

            <form-field
              v-model="state"
              :field="{
                label: 'Prize Money',
                key: 'pm',
                type: 'number',
                currency: 'USD'
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Plays',
                key: 'rh',
                type: 'radio',
                items: ['Right', 'Left']
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Backhand',
                key: 'bh',
                type: 'radio',
                items: ['One', 'Two']
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Turned Pro',
                key: 'turned_pro',
                type: 'calendar'
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Retired',
                key: 'retired',
                type: 'calendar'
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Official Website',
                key: 'official_link',
                type: 'textarea'
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Hall of Fame Induction',
                key: 'hof',
                type: 'calendar'
              }"
            />
          </div>
        </div>

        <u-separator label="Coaches" />

        <u-button
          :icon="ui.icons.plus"
          label="Add Coach"
          block
          @click="
            () => {
              state.coaches?.push({} as CoachSchema)
            }
          "
        />

        <u-form
          v-for="(_, index) in state.coaches"
          :key="index"
          nested
          :name="`coaches.${index}`"
          :schema="coachSchema"
          class="grid grid-cols-3 gap-6"
        >
          <form-field
            v-model="state.coaches![index]"
            :field="{ label: index === 0 ? 'Status' : '', key: 'status', type: 'radio', items: ['Current', 'Former'], required: true }"
          />

          <form-field
            v-model="state.coaches![index]"
            :field="{ label: index === 0 ? 'Coach' : '', key: 'person', type: 'person', required: true }"
            class="flex-1"
          />

          <form-field
            v-model="state.coaches![index]"
            :field="{ label: index === 0 ? 'Years' : '', key: 'years', type: 'text', placeholder: 'Years' }"
          />

          <u-button
            :icon="ui.icons.error"
            label="Remove Coach"
            color="error"
            class="col-span-3"
            block
            @click="
              () => {
                state.coaches!.splice(index, 1)
              }
            "
          />
        </u-form>

        <u-separator label="Previous Nationalities" />

        <u-button
          :icon="ui.icons.plus"
          label="Add Previous Nationality"
          block
          @click="
            () => {
              state.prev_nationalities?.push({} as NationalitySchema)
            }
          "
        />

        <u-form
          v-for="(_, index) in state.prev_nationalities"
          :key="index"
          nested
          :name="`prev_nationalities.${index}`"
          :schema="nationalitySchema"
          class="grid grid-cols-3 gap-6"
        >
          <u-form-field
            :label="index === 0 ? 'Country' : ''"
            name="country"
            required
          >
            <country-listbox v-model="state.prev_nationalities![index]!.country_id" />
          </u-form-field>

          <form-field
            v-model="state.prev_nationalities![index]"
            :field="{ label: index === 0 ? 'Start Date' : '', key: 'start_date', type: 'date', required: true }"
          />

          <form-field
            v-model="state.prev_nationalities![index]"
            :field="{ label: index === 0 ? 'End Date' : '', key: 'end_date', type: 'date', required: true }"
          />

          <u-button
            :icon="ui.icons.error"
            label="Delete Previous Nationality"
            color="error"
            class="col-span-3"
            block
            @click="
              () => {
                state.prev_nationalities!.splice(index, 1)
              }
            "
          />
        </u-form>
      </u-form>

      <template #footer>
        <div class="flex gap-3">
          <u-button
            form="update-form"
            color="success"
            type="submit"
            label="Update"
            block
            :icon="ICONS.save"
            :loading="isUpdating"
            :loading-icon="ICONS.uploading"
            :disabled="!selectedPlayer"
          />

          <u-button
            color="warning"
            label="Reset"
            block
            :icon="ui.icons.reload"
            @click="handleReset"
          />
        </div>
      </template>
    </u-card>

    <div class="space-y-6 max-w-1/3">
      <u-alert
        v-if="errors.length"
        v-for="(error, index) in errors"
        :key="index"
        color="error"
        variant="subtle"
        :title="error.type"
      >
        <template #description>
          {{ prettifyJson(error.details) }}
        </template>
      </u-alert>

      <u-page-card title="Request Body">
        <prose-code class="min-w-0 w-full overflow-x-auto">
          <pre
            class="overflow-x-auto"
            v-html="prettifyJson(state)"
          />
        </prose-code>
      </u-page-card>

      <u-page-card
        v-if="response"
        title="Response"
      >
        <prose-code class="min-w-0 w-full overflow-x-auto">
          <pre
            class="overflow-x-auto"
            v-html="prettifyJson(response)"
          />
        </prose-code>
      </u-page-card>
    </div>
  </div>
</template>
