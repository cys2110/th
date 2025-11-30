<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { cloneDeep, isEqual } from "lodash"

const { player } = defineProps<{
  player: PlayerType
}>()

const {
  params: { id }
} = useRoute("player")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

const open = ref(false)
const uploading = ref(false)

const initialState = {
  id,
  first_name: player.first_name,
  last_name: player.last_name,
  country: player.country
    ? {
        name: {
          value: player.country.id,
          label: player.country.name
        },
        start_date: player.country.start_date ? parseDate(player.country.start_date) : undefined
      }
    : undefined,
  former_countries: player.former_countries?.length
    ? player.former_countries.map(c => ({
        name: {
          value: c.id,
          label: c.name
        },
        dates: {
          start: c.start_date ? parseDate(c.start_date) : undefined,
          end: c.end_date ? parseDate(c.end_date) : undefined
        }
      }))
    : [],
  official_link: player.official_link,
  wiki_link: player.wiki_link,
  dob: player.dob ? parseDate(player.dob) : undefined,
  dod: player.dod ? parseDate(player.dod) : undefined,
  height: player.height,
  rh: player.rh,
  bh: player.bh,
  turned_pro: player.turned_pro,
  retired: player.retired,
  hof: player.hof,
  coaches: player.coaches?.length
    ? player.coaches.map(c => ({
        name: { value: c.id, label: `${c.first_name} ${c.last_name}` },
        years: c.years
      }))
    : [],
  former_coaches: player.former_coaches?.length
    ? player.former_coaches.map(c => ({
        name: { value: c.id, label: `${c.first_name} ${c.last_name}` },
        years: c.years
      }))
    : []
}

const state = ref<Partial<PlayerFormInput>>(cloneDeep(initialState))

const formFields: any[] = [
  { label: "First Name", key: "first_name", type: "text", required: true },
  { label: "Last Name", key: "last_name", type: "text", required: true },
  { label: "Date of Birth", key: "dob", type: "date" },
  { label: "Date of Death", key: "dod", type: "date" },
  {
    label: "Country",
    key: "country",
    schema: countryFormSchema,
    errorPattern: /^(name|start_date)$/,
    required: true,
    children: [
      { label: "Name", key: "name", type: "search", subType: "Country", placeholder: "Country" },
      { label: "Start Date", key: "start_date", type: "date" }
    ]
  },
  {
    label: "Former Representations",
    placeholder: "Former Representation",
    schema: formerCountryFormSchema,
    errorPattern: /^(name|dates)$/,
    type: "array",
    key: "former_countries",
    children: [
      { label: "Name", key: "name", type: "search", subType: "Country", placeholder: "Country" },
      { label: "Dates", key: "dates", type: "dates" }
    ]
  },
  { label: "Height (cm)", key: "height", type: "text", subType: "number", placeholder: "Enter height in cm" },
  { label: "Hall of Fame Induction", key: "hof", type: "text", subType: "number", placeholder: "Enter year inducted" },
  { label: "Turned Pro", key: "turned_pro", type: "text", subType: "number", placeholder: "Enter year turned pro" },
  { label: "Retired", key: "retired", type: "text", subType: "number", placeholder: "Enter year retired" },
  { label: "Plays", key: "rh", type: "radio", items: ["Right", "Left"] },
  { label: "Backhand", key: "bh", type: "radio", items: ["One", "Two"] },
  { label: "Wikipedia", key: "wiki_link", type: "textarea", placeholder: "Enter wiki link", class: "col-span-2" },
  { label: "Official Website", key: "official_link", type: "textarea", placeholder: "Enter official website link", class: "col-span-2" },
  {
    label: "Coaches",
    placeholder: "Coach",
    schema: coachFormSchema,
    errorPattern: /^(name|years)$/,
    type: "array",
    key: "coaches",
    children: [
      { label: "Name", key: "name", type: "search", subType: "Coach", placeholder: "Coach" },
      { label: "Years", key: "years", type: "text", placeholder: "Enter years coached" }
    ]
  },
  {
    label: "Former Coaches",
    placeholder: "Former Coach",
    schema: coachFormSchema,
    errorPattern: /^(name|years)$/,
    type: "array",
    key: "former_coaches",
    children: [
      { label: "Name", key: "name", type: "search", subType: "Coach", placeholder: "Coach" },
      { label: "Years", key: "years", type: "text", placeholder: "Enter years coached" }
    ]
  }
]

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<PlayerFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof PlayerFormSchema)[]
  const dirtyFields: Partial<PlayerFormSchema> = {}
  fields.forEach(field => {
    if (!isEqual(event.data[field], initialState[field])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  })

  if (Object.keys(dirtyFields).length) {
    dirtyFields["id"] = event.data.id // Always include the player ID

    const response = await $fetch("/api/players/update", {
      method: "POST",
      body: dirtyFields
    })

    if ((response as any).ok) {
      toast.add({
        title: `${event.data.first_name} ${event.data.last_name} updated`,
        icon: icons.success,
        color: "success"
      })

      set(open, false)
      reloadNuxtApp()
    } else {
      toast.add({
        title: "Error updating player",
        icon: icons.error,
        color: "error"
      })
    }
  } else {
    toast.add({
      title: "No changes to save",
      icon: icons.caution,
      color: "warning"
    })
  }

  set(uploading, false)
}
</script>

<template>
  <u-modal
    :title="player.first_name ? `${player.first_name} ${player.last_name}` : player.id"
    v-model:open="open"
  >
    <u-button
      :icon="ICONS.edit"
      :label="player.first_name ? `${player.first_name} ${player.last_name}` : player.id"
      block
      :color="player.first_name ? 'primary' : 'warning'"
    />

    <template #body>
      <!--@vue-expect-error-->
      <u-form
        id="player-form"
        :schema="playerFormSchema"
        :state="state"
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3 items-center">
          <template
            v-for="field in formFields"
            :key="field.label"
          >
            <u-form
              v-if="field.label === 'Country'"
              :schema="field.schema"
              :name="field.key"
              nested
              class="col-span-2"
            >
              <u-form-field
                :error-pattern="field.errorPattern"
                :label="field.label"
                :required="field.required"
              >
                <div class="grid grid-cols-2 gap-3 items-center">
                  <template
                    v-for="child in field.children"
                    :key="child.label"
                  >
                    <form-search
                      v-if="child.type === 'search'"
                      v-model="(state[field.key as keyof typeof state] as any)![child.key]"
                      :key="child.key"
                      :type="child.subType!"
                      :icon="child.icon"
                      :placeholder="child.placeholder"
                    />
                    <form-date-picker
                      v-else-if="child.type === 'date'"
                      v-model="(state[field.key as keyof typeof state] as any)![child.key]"
                    />
                  </template>
                </div>
              </u-form-field>
            </u-form>

            <template v-else-if="field.type === 'array'">
              <u-form
                v-for="(item, index) in state[field.key as keyof typeof state]"
                :key="index"
                :schema="field.schema"
                :name="`${field.key}.${index}`"
                nested
                class="col-span-2"
              >
                <u-form-field
                  :error-pattern="field.errorPattern"
                  :label="!index ? field.label : undefined"
                >
                  <div class="flex justify-evenly gap-3 items-center">
                    <template
                      v-for="child in field.children"
                      :key="`${child.label}-${index}`"
                    >
                      <form-search
                        v-if="child.type === 'search'"
                        v-model="item[child.key]"
                        :key="`${child.key}-${index}`"
                        :type="child.subType!"
                        :icon="child.icon"
                        :placeholder="child.placeholder"
                      />
                      <form-dates-picker
                        v-else-if="child.type === 'dates'"
                        v-model="item[child.key]"
                      />
                      <form-input
                        v-else-if="child.type === 'text'"
                        v-model="item[child.key]"
                        :placeholder="child.placeholder ?? `Enter ${child.label.toLowerCase()}`"
                      />
                    </template>

                    <u-button
                      :icon="icons.close"
                      @click=";(state[field.key as keyof typeof state] as any).splice(index, 1)"
                      color="error"
                    />
                  </div>
                </u-form-field>
              </u-form>
              <u-button
                block
                color="success"
                @click=";(state[field.key as keyof typeof state] as any).push({})"
                :label="`Add ${field.placeholder}`"
                class="col-span-2"
                :icon="icons.plus"
              />
            </template>

            <form-field
              v-else
              :field="field"
              v-model="state"
            />
          </template>
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
