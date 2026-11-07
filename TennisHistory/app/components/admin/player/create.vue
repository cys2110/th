<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { coachSchema, ICONS, nationalitySchema, playerSchema, prettifyJson } from "#imports"
import { playerInitialState } from "../utils"
import { endOfWeek, parseDate, startOfWeek, today } from "@internationalized/date"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()
const toast = useToast()

const { countries } = useCountryList()

const state = ref<Partial<PlayerInputSchema>>({ ...playerInitialState })
const isUploading = ref(false)
const response = ref()
const errors = ref<Array<{ type: string; details: any }>>([])
const imageUrl = ref<string | null>(null)

const handleReset = () => {
  set(state, { ...playerInitialState })
  set(response, null)
  set(errors, [])
  set(imageUrl, null)
}

const onError = (event: FormErrorEvent) => {
  errors.value.push({
    type: "Validation",
    details: event.errors
  })
}

const onSubmit = async (event: FormSubmitEvent<PlayerSchema>) => {
  set(isUploading, true)

  try {
    // Check that player isn't already in the database
    const { data: player, error: playerError } = await supabase
      .schema("tennis")
      .from("player")
      .select("id, ...people(full_name, nationality_id, dob)")
      .eq("id", event.data.id)
      .maybeSingle()

    if (playerError) {
      errors.value.push({
        type: "Error fetching player",
        details: playerError
      })
      return
    }

    if (player?.id) {
      errors.value.push({
        type: "Player already exists",
        details: player
      })
      return
    }

    let image_url: string | undefined
    // Upload to storage if a logo is selected
    if (event.data.image) {
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

    const { data, error } = await supabase
      .schema("tennis")
      .from("people")
      .insert({
        first_name: event.data.first_name,
        last_name: event.data.last_name,
        dob: event.data.dob?.toString(),
        dod: event.data.dod?.toString(),
        nationality_id: event.data.nationality_id,
        birth_place: event.data.birth_place,
        birth_country_id: event.data.birth_country_id
      })
      .select("id")

    if (error || !data) {
      errors.value.push({
        type: "Error creating person",
        details: error
      })
      return
    }

    const { data: playerData, error: playerInsertError } = await supabase
      .schema("tennis")
      .from("player")
      .insert({
        id: event.data.id,
        person_id: data[0]!.id,
        bh: event.data.bh,
        height: event.data.height,
        hof: event.data.hof?.year,
        official_link: event.data.official_link,
        pm: event.data.pm,
        retired: event.data.retired?.year,
        rh: event.data.rh,
        site_link:
          event.data.tour === "ATP" ?
            `https://www.atptour.com/en/players/${kebabCase(deburr(`${event.data.first_name} ${event.data.last_name}`))}/${event.data.id}/overview`
          : `https://www.wtatennis.com/players/${event.data.id}/${kebabCase(deburr(`${event.data.first_name} ${event.data.last_name}`))}`,
        tour: event.data.tour,
        turned_pro: event.data.turned_pro?.year,
        image_url
      })
      .select("*, ...people(full_name, nationality_id)")

    if (playerInsertError) {
      errors.value.push({
        type: "Error creating player",
        details: playerInsertError
      })
      return
    }

    if (event.data.coaches.length) {
      const { error: coachesError } = await supabase
        .schema("tennis")
        .from("player_coach_mapping")
        .insert(
          event.data.coaches.map(coach => ({
            player_id: event.data.id,
            coach_id: coach.person!.id,
            years: coach.years,
            status: coach.status
          }))
        )

      if (coachesError) {
        errors.value.push({
          type: "Error creating player coach relationships",
          details: coachesError
        })
      }
    }

    if (event.data.prev_nationalities?.length) {
      const { error: nationalitiesError } = await supabase
        .schema("tennis")
        .from("prev_nationality_mapping")
        .insert(
          event.data.prev_nationalities.map(nationality => ({
            player_id: event.data.id,
            country_id: nationality.country_id,
            start_date: nationality.start_date.toString(),
            end_date: nationality.end_date.toString()
          }))
        )

      if (nationalitiesError) {
        errors.value.push({
          type: "Error creating player nationalities",
          details: nationalitiesError
        })
      }
    }

    const rankingsData: Array<RankingsInsert> = []

    const now = today("America/New_York")
    const start = startOfWeek(now, "en-US", "mon")
    const end = endOfWeek(now, "en-US", "mon")

    if (event.data.current_singles) {
      rankingsData.push({
        player_id: event.data.id,
        rank: event.data.current_singles,
        match_type: "Singles",
        start_date: start.toString(),
        end_date: end.toString()
      })
    }

    if (event.data.current_doubles) {
      rankingsData.push({
        player_id: event.data.id,
        rank: event.data.current_doubles,
        match_type: "Doubles",
        start_date: start.toString(),
        end_date: end.toString()
      })
    }

    if (event.data.ch_singles && event.data.ch_singles_date) {
      rankingsData.push({
        player_id: event.data.id,
        rank: event.data.ch_singles,
        match_type: "Singles",
        start_date: event.data.ch_singles_date.toString(),
        end_date: event.data.ch_singles_date.add({ days: 6 }).toString()
      })
    }

    if (event.data.ch_doubles && event.data.ch_doubles_date) {
      rankingsData.push({
        player_id: event.data.id,
        rank: event.data.ch_doubles,
        match_type: "Doubles",
        start_date: event.data.ch_doubles_date.toString(),
        end_date: event.data.ch_doubles_date.add({ days: 6 }).toString()
      })
    }

    if (rankingsData.length) {
      const { error: rankingsError } = await supabase
        .schema("tennis")
        .from("rankings")
        .upsert(rankingsData, { onConflict: "player_id,match_type,start_date" })

      if (rankingsError) {
        errors.value.push({
          type: "Error creating player rankings",
          details: rankingsError
        })
      }
    }

    handleReset()
    set(response, playerData[0])
  } finally {
    set(isUploading, false)
  }
}

async function imageUrlToFile(imageUrl: unknown): Promise<File | null> {
  if (typeof imageUrl !== "string") return null

  let url: URL

  try {
    url = new URL(imageUrl)
  } catch {
    return null
  }

  if (!["http:", "https:"].includes(url.protocol)) return null

  try {
    const response = await fetch(url)

    if (!response.ok) return null

    const blob = await response.blob()

    if (!ACCEPTED_IMAGE_TYPES.includes(blob.type)) return null
    if (blob.size > MAX_FILE_SIZE) return null

    const extension = blob.type.split("/")[1] ?? "jpg"

    return new File([blob], `player.${extension}`, {
      type: blob.type
    })
  } catch {
    return null
  }
}

const handleScrape = async () => {
  try {
    const response = await fetch(`/api/scrape-players?id=${state.value.id}`)
    const data = await response.json()

    const { birthCountry, country, ch_singles_date, ch_doubles_date, dob, turned_pro, image, ...rest } = data

    state.value = {
      ...state.value,
      ...rest
    }

    if (image) {
      const file = await imageUrlToFile(image)

      if (file) {
        state.value.image = file
      } else {
        imageUrl.value = image
      }
    }
    if (dob) state.value.dob = parseDate(dob)
    if (ch_singles_date) state.value.ch_singles_date = parseDate(ch_singles_date)
    if (ch_doubles_date) state.value.ch_doubles_date = parseDate(ch_doubles_date)
    if (country) state.value.nationality_id = countries.value.find(c => c.name === country)?.id
    if (birthCountry) state.value.birth_country_id = countries.value.find(c => c.name === birthCountry)?.id
    if (turned_pro) state.value.turned_pro = parseDate(`${turned_pro}-01-01`)
  } catch (error) {
    console.error("Error scraping player:", error)
    toast.add({
      title: "Error scraping player",
      icon: ui.icons.error,
      color: "error"
    })
  }
}
</script>

<template>
  <div class="flex gap-6 items-start">
    <u-card class="basis-2/3">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="font-semibold">Create Player</div>

          <u-button
            :icon="ICONS.download"
            label="Scrape"
            :disabled="!state.id"
            @click="handleScrape"
          />
        </div>
      </template>

      <u-form
        id="player-form"
        :schema="playerSchema"
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-6"
      >
        <div class="grid grid-cols-3 gap-6">
          <form-field
            v-model="state"
            :field="{
              label: 'Profile Picture',
              key: 'image',
              type: 'image',
              class: 'col-span-3'
            }"
          />

          <form-field
            v-model="state"
            :field="{
              label: 'ID',
              key: 'id',
              type: 'text',
              required: true
            }"
          />

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

          <div class="space-y-6">
            <form-field
              v-model="state"
              :field="{
                label: 'Tour',
                key: 'tour',
                type: 'radio',
                items: ['ATP', 'WTA'],
                required: true
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
          </div>

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
            label="Nationality"
            key="nationality_id"
            required
          >
            <country-listbox v-model="state.nationality_id" />
          </u-form-field>

          <div class="space-y-6">
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
                label: 'Prize Money',
                key: 'pm',
                type: 'number',
                currency: 'USD'
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
          </div>

          <div class="space-y-6">
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
                label: 'Hall of Fame Induction',
                key: 'hof',
                type: 'calendar'
              }"
            />
          </div>

          <div class="space-y-6">
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

          <div class="space-y-6">
            <form-field
              v-model="state"
              :field="{
                label: 'Current Singles Ranking',
                key: 'current_singles',
                type: 'number'
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Singles Career High',
                key: 'ch_singles',
                type: 'number'
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Singles Career High Date',
                key: 'ch_singles_date',
                type: 'date'
              }"
            />
          </div>

          <div class="space-y-6">
            <form-field
              v-model="state"
              :field="{
                label: 'Current Doubles Ranking',
                key: 'current_doubles',
                type: 'number'
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Doubles Career High',
                key: 'ch_doubles',
                type: 'number'
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Doubles Career High Date',
                key: 'ch_doubles_date',
                type: 'date'
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
            form="player-form"
            color="success"
            type="submit"
            label="Create"
            block
            :icon="ui.icons.plus"
            :loading="isUploading"
            :loading-icon="ICONS.uploading"
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

    <div class="min-w-0 basis-1/3 space-y-6">
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
          <pre class="overflow-x-auto" v-html="prettifyJson(state)" />
        </prose-code>
      </u-page-card>

      <u-page-card
        v-if="response"
        title="Response"
      >
        <prose-code class="min-w-0 w-full overflow-x-auto">
          <pre class="overflow-x-auto" v-html="prettifyJson(response)" />
        </prose-code>
      </u-page-card>
    </div>
  </div>
</template>
