<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const { player } = defineProps<{ player: PlayerInterface }>()
const {
  params: { id }
} = useRoute("player")

const toast = useToast()
const {
  ui: { icons, colors }
} = useAppConfig()
const open = ref(false)
const uploading = ref(false)

const state = reactive<Partial<PlayerInput>>({
  id,
  first_name: player.first_name,
  last_name: player.last_name,
  tour: player.tour,
  country: player.country
    ? {
        value: player.country.id,
        label: player.country.name,
        start_date: player.country.start_date ? parseDate(player.country.start_date) : undefined
      }
    : {
        value: "",
        label: "",
        start_date: undefined
      },
  former_countries: player.former_countries
    ? player.former_countries.map(c => ({
        value: c.id,
        label: c.name,
        start_date: c.start_date ? parseDate(c.start_date) : undefined,
        end_date: c.end_date ? parseDate(c.end_date) : undefined
      }))
    : [],
  current_singles: player.current_singles,
  current_doubles: player.current_doubles,
  ch_singles: player.ch_singles,
  ch_doubles: player.ch_doubles,
  singles_ch_date: player.singles_ch_date ? parseDate(player.singles_ch_date) : undefined,
  doubles_ch_date: player.doubles_ch_date ? parseDate(player.doubles_ch_date) : undefined,
  dob: player.dob ? parseDate(player.dob) : undefined,
  dod: player.dod ? parseDate(player.dod) : undefined,
  turned_pro: player.turned_pro,
  retired: player.retired,
  rh: player.rh,
  bh: player.bh,
  coaches: player.coaches
    ? player.coaches.map(c => ({
        value: c.id,
        label: c.first_name + " " + c.last_name,
        years: c.years
      }))
    : [],
  former_coaches: player.former_coaches
    ? player.former_coaches.map(c => ({
        value: c.id,
        label: c.first_name + " " + c.last_name,
        years: c.years
      }))
    : [],
  site_link: player.site_link,
  wiki_link: player.wiki_link,
  official_link: player.official_link,
  height: player.height,
  pm: player.pm,
  hof: player.hof
})

const formFields: FormFieldInterface<PlayerSchema>[] = [
  { label: "First Name", key: "first_name", type: "text" },
  { label: "Last Name", key: "last_name", type: "text" },
  { label: "Tour", key: "tour", type: "radio", items: ["ATP", "WTA"] },
  { label: "Height (cm)", key: "height", type: "number" },
  { label: "Date of Birth", key: "dob", type: "date" },
  { label: "Date of Death", key: "dod", type: "date" },
  { label: "Turned Pro", key: "turned_pro", type: "text", subType: "number" },
  { label: "Retired", key: "retired", type: "text", subType: "number" },
  { label: "Plays", key: "rh", type: "radio", items: ["Right", "Left"] },
  { label: "Backhand", key: "bh", type: "radio", items: ["One", "Two"] },
  { label: "Prize Money", key: "pm", type: "currency", required: true },
  { label: "Hall of Fame Induction", key: "hof", type: "text", subType: "number" }
]

const rankFields: { label: string; children: FormFieldInterface<PlayerSchema>[] }[] = [
  {
    label: "Singles",
    children: [
      { label: "Current rank", key: "current_singles", type: "number" },
      { label: "Career high", key: "ch_singles", type: "number" },
      { label: "Career high date", key: "singles_ch_date", type: "date" }
    ]
  },
  {
    label: "Doubles",
    children: [
      { label: "Current rank", key: "current_doubles", type: "number" },
      { label: "Career high", key: "ch_doubles", type: "number" },
      { label: "Career high date", key: "doubles_ch_date", type: "date" }
    ]
  }
]

const linkFields: FormFieldInterface<PlayerSchema>[] = [
  { label: "Site", key: "site_link", type: "textarea" },
  { label: "Wiki", key: "wiki_link", type: "textarea" },
  { label: "Official", key: "official_link", type: "textarea" }
]

const handleReset = () => {
  state.first_name = player.first_name
  state.last_name = player.last_name
  state.tour = player.tour
  state.country = player.country
    ? {
        value: player.country.id,
        label: player.country.name,
        start_date: player.country.start_date ? parseDate(player.country.start_date) : undefined
      }
    : {
        value: "",
        label: "",
        start_date: undefined
      }
  state.former_countries = player.former_countries
    ? player.former_countries.map(c => ({
        value: c.id,
        label: c.name,
        start_date: c.start_date ? parseDate(c.start_date) : undefined,
        end_date: c.end_date ? parseDate(c.end_date) : undefined
      }))
    : []
  state.current_singles = player.current_singles
  state.current_doubles = player.current_doubles
  state.ch_singles = player.ch_singles
  state.ch_doubles = player.ch_doubles
  state.singles_ch_date = player.singles_ch_date ? parseDate(player.singles_ch_date) : undefined
  state.doubles_ch_date = player.doubles_ch_date ? parseDate(player.doubles_ch_date) : undefined
  state.dob = player.dob ? parseDate(player.dob) : undefined
  state.dod = player.dod ? parseDate(player.dod) : undefined
  state.turned_pro = player.turned_pro
  state.retired = player.retired
  state.rh = player.rh
  state.bh = player.bh
  state.coaches = player.coaches
    ? player.coaches.map(c => ({
        value: c.id,
        label: c.first_name + " " + c.last_name,
        years: c.years
      }))
    : undefined
  state.former_coaches = player.former_coaches
    ? player.former_coaches.map(c => ({
        value: c.id,
        label: c.first_name + " " + c.last_name,
        years: c.years
      }))
    : undefined
  state.site_link = player.site_link
  state.wiki_link = player.wiki_link
  state.official_link = player.official_link
  state.height = player.height
  state.pm = player.pm
  state.hof = player.hof
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Please ensure fields are filled out correctly",
    description: event.errors.map(e => e.message).join(", "),
    icon: icons.error,
    color: "error"
  })
}

const onSubmit = async (event: FormSubmitEvent<PlayerSchema>) => {
  set(uploading, true)
  try {
    const response = await $fetch("/api/players/update", {
      query: event.data
    })

    if ((response as any).ok) {
      toast.add({
        title: "Player updated",
        icon: icons.success,
        color: "success"
      })
      handleReset()
      set(open, false)
    } else {
      toast.add({
        title: "Error updating player",
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: "Error updating player",
      description: (e as Error).message,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(uploading, false)
  }
}
</script>

<template>
  <u-modal
    :title="`Edit ${player.first_name} ${player.last_name}`"
    v-model:open="open"
  >
    <u-button
      :icon="ICONS.edit"
      :label="`Edit ${player.first_name} ${player.last_name}`"
      block
    />

    <template #body>
      <u-form
        id="player-form"
        :schema="playerSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-5 items-center">
          <template
            v-for="field in formFields"
            :key="field.label"
          >
            <form-input
              v-if="field.type === 'text'"
              v-model="state[field.key]"
              :placeholder="field.label"
              :type="field.subType"
            />

            <u-radio-group
              v-else-if="field.type === 'radio'"
              v-model="(state[field.key] as string)"
              :legend="field.label"
              :items="field.items"
              orientation="horizontal"
            />

            <form-input-number
              v-else-if="field.type === 'number'"
              v-model="(state[field.key] as number)"
              :placeholder="field.label"
            />

            <form-date-picker
              v-else-if="field.type === 'date'"
              v-model="state[field.key]"
              :placeholder="field.label"
            />

            <form-currency
              v-else-if="field.type === 'currency'"
              v-model="(state[field.key] as number)"
              :placeholder="field.label"
            />
          </template>

          <u-form-field class="col-span-2">
            <div class="flex justify-stretch items-center gap-0.5">
              <form-select-search
                v-model="state.country"
                type="countries"
                placeholder="Country"
                block
                size="xs"
                class="min-w-1/3"
              />
              <form-date-picker
                v-model="state.country!.start_date"
                placeholder="Start date"
              />
              <u-button
                color="error"
                :icon="icons.close"
                @click="state.country = { value: '', label: '', start_date: undefined }"
              />
            </div>
          </u-form-field>

          <u-form-field
            label="Former Representations"
            class="col-span-2"
          >
            <div class="flex flex-col gap-1 mt-3">
              <div
                v-for="(country, index) in state.former_countries"
                :key="country.value"
                class="flex justify-stretch items-center gap-0.5"
              >
                <form-select-search
                  v-model="(state.former_countries![index] as SelectOptionsType)"
                  placeholder="Country"
                  type="countries"
                  block
                  size="xs"
                  class="min-w-1/3"
                />
                <form-date-picker
                  v-model="state.former_countries![index]!.start_date"
                  placeholder="Start date"
                />
                <form-date-picker
                  v-model="state.former_countries![index]!.end_date"
                  placeholder="End date"
                />
                <u-button
                  color="error"
                  :icon="icons.close"
                  @click="state.former_countries = state.former_countries?.filter(c => c.value !== country.value)"
                />
              </div>
              <u-button
                label="Add Former Country"
                icon="solar:globus-line-duotone"
                block
                @click="state.former_countries!.push({ value: undefined, label: undefined, start_date: undefined, end_date: undefined })"
              />
            </div>
          </u-form-field>

          <u-form-field
            v-for="group in rankFields"
            :key="group.label"
            :label="group.label"
            class="col-span-2"
          >
            <div class="flex justify-stretch items-center gap-0.5 mt-3">
              <template
                v-for="child in group.children"
                :key="child.key"
              >
                <form-input-number
                  v-if="child.type === 'number'"
                  :placeholder="child.label"
                  v-model="(state[child.key] as number)"
                  size="xs"
                  class="min-w-1/4"
                />
                <form-date-picker
                  v-else
                  v-model="state[child.key]"
                  :placeholder="child.label"
                />
              </template>
            </div>
          </u-form-field>

          <u-form-field
            label="Links"
            class="col-span-2"
          >
            <div class="flex flex-col gap-2 mt-3">
              <form-textarea
                v-for="field in linkFields"
                :key="field.label"
                v-model="(state[field.key] as string)"
                :placeholder="field.label"
              />
            </div>
          </u-form-field>

          <u-form-field
            label="Coaches"
            class="col-span-2"
          >
            <div class="flex flex-col gap-1">
              <div
                v-if="state.coaches?.length"
                v-for="(coach, index) in state.coaches || []"
                :key="coach.value || index"
                class="flex justify-stretch items-center gap-0.5 mt-3"
              >
                <form-select-search
                  type="coaches"
                  v-model="(state.coaches![index] as SelectOptionsType)"
                  placeholder="Coach"
                  block
                  class="min-w-1/2"
                  size="xs"
                />
                <form-input
                  v-model="state.coaches![index]!.years"
                  placeholder="Years coached"
                  size="xs"
                />
                <u-button
                  color="error"
                  :icon="icons.close"
                  @click="state.coaches = state.coaches!.filter(c => c.value !== coach.value)"
                />
              </div>
              <u-button
                label="Add Coach"
                icon="line-md:account-add"
                block
                @click="state.coaches!.push({ value: undefined, label: undefined, years: undefined })"
              />
            </div>
          </u-form-field>

          <u-form-field
            label="Former Coaches"
            class="col-span-2"
          >
            <div class="flex flex-col gap-1">
              <div
                v-if="state.former_coaches?.length"
                v-for="(coach, index) in state.former_coaches || []"
                :key="coach.value || index"
                class="flex justify-stretch items-center gap-0.5 mt-3"
              >
                <form-select-search
                  type="coaches"
                  v-model="(state.former_coaches![index] as SelectOptionsType)"
                  placeholder="Coach"
                  block
                  class="min-w-1/2"
                  size="xs"
                />
                <form-input
                  v-model="state.former_coaches![index]!.years"
                  placeholder="Years coached"
                  size="xs"
                />
                <u-button
                  color="error"
                  :icon="icons.close"
                  @click="state.former_coaches = state.former_coaches.filter(c => c !== coach)"
                />
              </div>
              <u-button
                label="Add Former Coach"
                icon="line-md:account-add"
                block
                @click="state.former_coaches!.push({ value: undefined, label: undefined, years: undefined })"
              />
            </div>
          </u-form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-button
        form="player-form"
        type="submit"
        label="Save"
        :icon="uploading ? ICONS.uploading : icons.check"
        block
      />
      <u-button
        label="Reset"
        :icon="icons.reload"
        @click="handleReset"
        block
        color="warning"
      />
      <u-button
        label="Cancel"
        :icon="icons.error"
        @click="close"
        block
        color="error"
      />
    </template>
  </u-modal>
</template>
