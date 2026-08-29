<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { any, array, coerce, object, string, url, z } from "zod"
import { set } from "@vueuse/core"
import { ICONS } from "#imports"
import { endOfWeek, parseDate, startOfWeek, today } from "@internationalized/date"
import { deburr } from "lodash"
import { type Database } from "~/types/database.types"

type RankingInsert = Database["tennis"]["Tables"]["rankings"]["Insert"]

const coachSchema = object({
  person: object({ id: string() }).optional(),
  years: string().optional(),
  status: string()
})
type CoachSchema = z.infer<typeof coachSchema>

const nationalitySchema = object({
  country: object({ id: string() }).optional(),
  start_date: any().optional(),
  end_date: any().optional()
})
type NationalitySchema = z.infer<typeof nationalitySchema>

const schema = object({
  id: coerce.string().min(1, "Player ID is required."),
  first_name: string().min(1, "First name is required."),
  last_name: string().min(1, "Last name is required."),
  dob: any().nullish(),
  dod: any().nullish(),
  nationality: object({ id: string() }),
  birth_place: string().nullish(),
  birth_country: object({ id: string() }).nullish(),
  bh: string().nullish(),
  rh: string().nullish(),
  height: coerce.number("Height must be a number").int("Height must be an integer").positive("Height must be positive").nullish(),
  hof: any().nullish(),
  tour: TourEnum,
  official_link: url("Website must be a valid URL.").nullish(),
  pm: coerce
    .number("Prize money must be a number")
    .int("Prize money must be an integer")
    .nonnegative("Prize money cannot be a negative number")
    .nullish(),
  retired: any().nullish(),
  turned_pro: any().nullish(),
  current_singles: coerce.number().nullish(),
  ch_singles: coerce.number().nullish(),
  ch_singles_date: any().nullish(),
  current_doubles: coerce.number().nullish(),
  ch_doubles: coerce.number().nullish(),
  ch_doubles_date: any().nullish(),
  coaches: array(coachSchema).default([]),
  prev_nationalities: array(nationalitySchema).default([]),
  image: z
    .instanceof(File, {
      message: "Please select an image file."
    })
    .refine(file => file.size <= MAX_FILE_SIZE, {
      message: `The image is too large. Please choose an image smaller than ${formatBytes(MAX_FILE_SIZE)}.`
    })
    .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: "Please upload a valid image file (JPEG, PNG, or WebP)."
    })
    .nullish()
})
type SchemaInput = z.input<typeof schema>
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const { countries } = useCountryList()

const isOpen = ref(false)
const isUploading = ref(false)

const state = ref<Partial<SchemaInput>>({
  coaches: [],
  prev_nationalities: []
})
const coaches = ref<string[]>([])
const imageUrl = ref<string | null>(null)

const handleReset = () => {
  set(state, {
    coaches: [],
    prev_nationalities: []
  })
  set(coaches, [])
  set(imageUrl, null)
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Validation error",
    icon: ui.icons.error,
    color: "error"
  })
  console.error("Validation error:", event)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)

  try {
    // Check that player isn't already in the database
    const { data: player, error: playerError } = await supabase.schema("tennis").from("player").select("id").eq("id", event.data.id).maybeSingle()

    if (playerError) {
      console.error("Error fetching player:", playerError)
      throw Error
    }

    if (player?.id) {
      toast.add({
        title: "Player already exists",
        icon: ui.icons.error,
        color: "error"
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

      if (error) {
        console.error("Error uploading player image:", error)
        throw Error
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
        nationality_id: event.data.nationality.id,
        birth_place: event.data.birth_place,
        birth_country_id: event.data.birth_country?.id
      })
      .select("id")

    if (error || !data) {
      console.error("Error creating person:", error)
      throw Error
    }

    const { error: playerInsertError } = await supabase
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

    if (playerInsertError) {
      console.error("Error creating player:", playerInsertError)
      throw Error
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
        console.error("Error creating player coaches:", coachesError)
        toast.add({
          title: "Error creating player coach relationships",
          icon: ui.icons.error,
          color: "error"
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
            country_id: nationality.country!.id,
            start_date: nationality.start_date.toString(),
            end_date: nationality.end_date.toString()
          }))
        )

      if (nationalitiesError) {
        console.error("Error creating player nationalities:", nationalitiesError)
        toast.add({
          title: "Error creating player nationality relationships",
          icon: ui.icons.error,
          color: "error"
        })
      }
    }

    const rankingsData: Array<RankingInsert> = []

    if (event.data.current_singles || event.data.current_doubles) {
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
      const { error: rankingsError } = await supabase.schema("tennis").from("rankings").insert(rankingsData)

      if (rankingsError) {
        console.error("Error creating player rankings:", rankingsError)
        toast.add({
          title: "Error creating player rankings",
          icon: ui.icons.error,
          color: "error"
        })
      }
    }

    handleReset()
    set(isOpen, false)
    // router.push({
    //   name: "player",
    //   params: { id: event.data.id, name: kebabCase(`${event.data.first_name} ${event.data.last_name}`) }
    // })
  } catch (error) {
    toast.add({
      title: "Error creating player",
      icon: ui.icons.error,
      color: "error"
    })
  } finally {
    set(isUploading, false)
  }
}

const formFields = computed<Array<FormFieldInterface<Schema>>>(
  () =>
    [
      { label: "Profile picture", key: "image", type: "image", class: "col-span-2" },
      { label: "Player Id", key: "id", type: "text", required: true },
      { label: "Tour", key: "tour", type: "radio", items: ["ATP", "WTA"], required: true },
      { label: "First Name", key: "first_name", type: "text", required: true },
      { label: "Last Name", key: "last_name", type: "text", required: true },
      { label: "Date of Birth", key: "dob", type: "date" },
      { label: "Date of Death", key: "dod", type: "date" },
      { label: "Nationality", key: "nationality", type: "country", required: true },
      { label: "Height", key: "height", type: "number" },
      { label: "Birth Place", key: "birth_place", type: "text" },
      { label: "Birth Country", key: "birth_country", type: "country" },
      { label: "Plays", key: "rh", type: "radio", items: ["Right", "Left"] },
      { label: "Backhand", key: "bh", type: "radio", items: ["One", "Two"] },
      { label: "Turned Pro", key: "turned_pro", type: "calendar" },
      { label: "Retired", key: "retired", type: "calendar" },
      { label: "Current Singles Ranking", key: "current_singles", type: "number" },
      { label: "Current Doubles Ranking", key: "current_doubles", type: "number" },
      { label: "Singles Career High", key: "ch_singles", type: "number" },
      { label: "Doubles Career High", key: "ch_doubles", type: "number" },
      { label: "Singles Career High Date", key: "ch_singles_date", type: "date" },
      { label: "Doubles Career High Date", key: "ch_doubles_date", type: "date" },
      { label: "Prize Money", key: "pm", type: "number", currency: "USD" },
      { label: "Hall of Fame Induction", key: "hof", type: "calendar" },
      { label: "Official Website", key: "official_link", type: "textarea", class: "col-span-2" }
    ] as Array<FormFieldInterface<Schema>>
)

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

    console.log(data)

    const { birthCountry, country, coaches: coachesData, ch_singles_date, ch_doubles_date, dob, turned_pro, image, ...rest } = data

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
    if (country) state.value.nationality = countries.value.find(c => c.name === country)
    if (birthCountry) state.value.birth_country = countries.value.find(c => c.name === birthCountry)
    if (coachesData) coaches.value = coachesData
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
  <u-modal
    :title="`Create ${state.first_name ? `${state.first_name}${state.last_name ? ` ${state.last_name}` : ''}` : 'Player'}`"
    v-model:open="isOpen"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-user
        v-if="imageUrl"
        name="Image"
        :to="imageUrl"
        target="_blank"
        :avatar="{ src: imageUrl, loading: 'lazy', icon: ICONS.player }"
        class="mb-3"
      />

      <u-form
        id="player-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <u-button
          :icon="ICONS.download"
          label="Scrape"
          :disabled="!state.id"
          @click="handleScrape"
          block
        />

        <div class="grid grid-cols-2 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          />
        </div>

        <div
          v-if="coaches.length"
          class="text-sm"
          >Coaches: {{ coaches }}</div
        >

        <u-form
          v-for="(_, index) in state.coaches"
          :key="index"
          nested
          :name="`coaches.${index}`"
          :schema="coachSchema"
          class="flex items-end gap-3"
        >
          <form-field
            v-model="state.coaches![index]"
            :field="{ label: index === 0 ? 'Coach' : '', key: 'person', type: 'person', required: true }"
            class="flex-1"
          />

          <form-field
            v-model="state.coaches![index]"
            :field="{ label: index === 0 ? 'Status' : '', key: 'status', type: 'radio', items: ['Current', 'Former'], required: true }"
            class="self-start"
          />

          <form-field
            v-model="state.coaches![index]"
            :field="{ label: index === 0 ? 'Years' : '', key: 'years', type: 'text', placeholder: 'Years' }"
          />

          <u-button
            :icon="ui.icons.error"
            color="error"
            size="sm"
            @click="
              () => {
                state.coaches!.splice(index, 1)
              }
            "
          />
        </u-form>

        <u-button
          :icon="ui.icons.plus"
          label="Add Coach"
          block
          size="xs"
          @click="
            () => {
              state.coaches?.push({} as CoachSchema)
            }
          "
        />

        <u-form
          v-for="(_, index) in state.prev_nationalities"
          :key="index"
          nested
          :name="`prev_nationalities.${index}`"
          :schema="nationalitySchema"
          class="space-y-3"
        >
          <div class="flex items-end gap-3">
            <form-field
              v-model="state.prev_nationalities![index]"
              :field="{ label: index === 0 ? 'Country' : '', key: 'country', type: 'country', required: true }"
              class="flex-1"
            />

            <u-button
              :icon="ui.icons.error"
              color="error"
              size="sm"
              @click="
                () => {
                  state.prev_nationalities!.splice(index, 1)
                }
              "
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <form-field
              v-model="state.prev_nationalities![index]"
              :field="{ label: index === 0 ? 'Start Date' : '', key: 'start_date', type: 'date', required: true }"
            />

            <form-field
              v-model="state.prev_nationalities![index]"
              :field="{ label: index === 0 ? 'End Date' : '', key: 'end_date', type: 'date', required: true }"
            />
          </div>
        </u-form>

        <u-button
          :icon="ui.icons.plus"
          label="Add Previous Nationality"
          block
          size="xs"
          @click="
            () => {
              state.prev_nationalities?.push({} as NationalitySchema)
            }
          "
        />
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="player-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
