<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const props = defineProps<{
  player: PlayerDetailsType
}>()

const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const playerStore = usePlayerStore()

const open = ref(false)
const uploading = ref(false)

const initialState = {
  ...props.player,
  tour: playerStore.tour,
  country:
    props.player.country ?
      {
        name: {
          value: props.player.country.id,
          label: props.player.country.name
        },
        start_date: props.player.country.start_date ? parseDate(props.player.country.start_date) : undefined
      }
    : undefined,
  former_countries:
    props.player.former_countries?.length ?
      props.player.former_countries.map(c => ({
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
  dob: props.player.dob ? parseDate(props.player.dob) : undefined,
  dod: props.player.dod ? parseDate(props.player.dod) : undefined,
  coaches:
    props.player.coaches?.length ?
      props.player.coaches.map(c => ({
        name: { value: c.id, label: `${c.first_name} ${c.last_name}` },
        years: c.years
      }))
    : [],
  former_coaches:
    props.player.former_coaches?.length ?
      props.player.former_coaches.map(c => ({
        name: { value: c.id, label: `${c.first_name} ${c.last_name}` },
        years: c.years
      }))
    : []
}

const state = ref<Partial<PlayerFormSchema>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<PlayerFormSchema>) => {
  set(uploading, true)

  // Only send changed fields to reduce payload size
  const fields = Object.keys(event.data) as (keyof PlayerFormSchema)[]
  const dirtyFields: Partial<PlayerFormSchema> = {
    id: event.data.id,
    first_name: event.data.first_name,
    last_name: event.data.last_name
  }

  for (const field of fields) {
    if (field === "id" || field === "first_name" || field === "last_name") continue

    if (!isEqual(event.data[field], initialState[field])) {
      dirtyFields[field] = (event.data[field] as any) ?? null
    }
  }

  if (Object.keys(dirtyFields).length > 3) {
    await $fetch("/api/players/update", {
      method: "POST",
      body: dirtyFields
    })
      .then(response => {
        toast.add({
          title: `${event.data.first_name} ${event.data.last_name} successfully updated.`,
          icon: icons.success,
          color: "success"
        })

        set(open, false)
        reloadNuxtApp() // Reload for wrapper to update
      })
      .catch(e => {
        if (e.statusMessage === "Validation errors") {
          console.error(e.statusMessage, e.data?.data.validationErrors)
        } else {
          console.error(e)
        }

        toast.add({
          title: `Error updating ${event.data.first_name} ${event.data.last_name}`,
          description: e.statusMessage ?? "An unknown error occurred",
          icon: icons.error,
          color: "error"
        })
      })
      .finally(() => {
        set(uploading, false)
      })
  } else {
    toast.add({
      title: `No changes to save for ${event.data.first_name} ${event.data.last_name}`,
      icon: icons.caution,
      color: "warning"
    })

    set(uploading, false)
  }
}

const formFields: FormFieldInterface<PlayerFormSchema>[] = [
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
      { label: "Name", key: "name", type: "search", subType: "Country", icon: ICONS.globe },
      { label: "Start Date", key: "start_date", type: "date" }
    ]
  },
  {
    label: "Former Representations",
    placeholder: "former representation",
    schema: formerCountryFormSchema,
    errorPattern: /^(name|dates)$/,
    type: "array",
    key: "former_countries",
    children: [
      { label: "Name", key: "name", type: "search", subType: "Country", placeholder: "country", icon: ICONS.globe },
      { label: "Dates", key: "dates", type: "dates" }
    ]
  },
  { label: "Height", key: "height", help: "Enter height in cm", type: "number" },
  { label: "Hall of Fame Induction", key: "hof", type: "text", subType: "number", help: "Enter year of induction" },
  { label: "Turned Pro", key: "turned_pro", type: "text", subType: "number" },
  { label: "Retired", key: "retired", type: "text", subType: "number" },
  { label: "Plays", key: "rh", type: "radio", items: ["Right", "Left"] },
  { label: "Backhand", key: "bh", type: "radio", items: ["One", "Two"] },
  { label: "Wikipedia URL", key: "wiki_link", type: "textarea", class: "col-span-2" },
  { label: "Official Website", key: "official_link", type: "textarea", class: "col-span-2" },
  {
    label: "Coaches",
    placeholder: "coach",
    schema: coachFormSchema,
    errorPattern: /^(name|years)$/,
    type: "array",
    key: "coaches",
    children: [
      { label: "Name", key: "name", type: "search", subType: "Coach", placeholder: "Coach", icon: ICONS.coach },
      { label: "Years", key: "years", type: "text", placeholder: "Enter years coached" }
    ]
  },
  {
    label: "Former Coaches",
    placeholder: "former coach",
    schema: coachFormSchema,
    errorPattern: /^(name|years)$/,
    type: "array",
    key: "former_coaches",
    children: [
      { label: "Name", key: "name", type: "search", subType: "Coach", placeholder: "Former Coach", icon: ICONS.coach },
      { label: "Years", key: "years", type: "text", placeholder: "Enter years coached" }
    ]
  }
]
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
      :color="player.first_name ? 'warning' : 'error'"
    />

    <template #body>
      <u-form
        id="player-form"
        :schema="playerFormSchema"
        :state
        @submit="<any>onSubmit"
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
              nested
              class="col-span-2"
            >
              <u-form-field
                :error-patter="field.errorPattern"
                :label="field.label"
                :required="field.required"
              >
                <u-field-group class="w-full">
                  <template
                    v-for="child in field.children"
                    :key="child.label"
                  >
                    <form-date-picker
                      v-if="child.type === 'date'"
                      v-model="(state[field.key as keyof typeof state] as any)![child.key as keyof any]"
                    />
                    <form-search
                      v-else-if="child.type === 'search'"
                      v-model="(state[field.key as keyof typeof state] as any)![child.key as keyof any]"
                      :key="child.key"
                      :type="child.subType!"
                      :placeholder="child.placeholder"
                      :icon="child.icon"
                    />
                  </template>
                </u-field-group>
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
                  <u-field-group class="w-full">
                    <template
                      v-for="child in field.children"
                      :key="`${child.label}-${index}`"
                    >
                      <form-search
                        v-if="child.type === 'search'"
                        v-model="item![child.key as keyof typeof item]"
                        :key="`${String(child.key)}-${index}`"
                        :type="child.subType!"
                        :placeholder="child.placeholder"
                        :icon="child.icon"
                      />
                      <form-dates-picker
                        v-else-if="child.type === 'dates'"
                        v-model="item![child.key as keyof typeof item]"
                      />
                      <form-input
                        v-else-if="child.type === 'text'"
                        v-model="item![child.key as keyof typeof item]"
                        :placeholder="child.placeholder ?? `Enter ${child.label.toLowerCase()}`"
                      />
                    </template>
                    <u-button
                      :icon="icons.close"
                      @click=";(state[field.key as keyof typeof state] as any).splice(index, 1)"
                      color="error"
                    />
                  </u-field-group>
                </u-form-field>
              </u-form>
              <u-button
                block
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
        :icon="uploading ? ICONS.uploading : icons.upload"
        block
        color="success"
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
