<script setup lang="ts">
import { array, coerce, object, string, url, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "~/utils/variables"
import { deburr, snakeCase } from "lodash"

const schema = object({
  name: string().min(1, "Name is required"),
  short_name: string().optional(),
  code: string().min(1, "Code is required"),
  nicknames: array(string()).default([]),
  colours: array(string()).default([]),
  country: object({ id: string() }).optional(),
  type: TeamTypeEnum,
  founded: coerce.number().int("Founded year must be an integer").positive("Founded year must be positive").optional(),
  website: url().optional(),
  logo: z
    .instanceof(File, {
      message: "Please select an image file."
    })
    .refine(file => file.size <= MAX_FILE_SIZE, {
      message: `The image is too large. Please choose an image smaller than ${formatBytes(MAX_FILE_SIZE)}.`
    })
    .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: "Please upload a valid image file (JPEG, PNG, or WebP)."
    })
    .optional(),
  home_venue: object({ id: string() }).optional()
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const emits = defineEmits<{ refresh: [] }>()

const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>({
  nicknames: [],
  colours: []
})

const handleReset = () => {
  set(state, { nicknames: [], colours: [] })
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, JSON.stringify(event.errors))

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  try {
    const { country, logo, home_venue, ...rest } = event.data
    let logoUrl: string | undefined

    // Upload to storage if a logo is selected
    if (logo) {
      const { data, error } = await supabase.storage.from("football").upload(`teams/${deburr(snakeCase(rest.short_name || rest.name))}`, logo, {
        cacheControl: "3600",
        upsert: true
      })

      if (error) {
        throw new Error(`Error uploading team logo for ${event.data.name}: ${error.message}`)
      }

      const { data: publicUrlData } = supabase.storage.from("football").getPublicUrl(data.path)
      logoUrl = publicUrlData.publicUrl
    }

    const { error } = await supabase
      .schema("football")
      .from("team")
      .insert({ ...rest, country_id: country?.id, logo_url: logoUrl, home_venue_id: home_venue?.id })

    if (error) {
      throw new Error(`Error creating team: ${error.message}`)
    }
    handleReset()
    emits("refresh")
    set(isOpen, false)
  } catch (error) {
    console.error(error)
    set(errors, error)
    toast.add({
      title: `Error creating ${event.data.name}`,
      icon: ui.icons.error,
      color: "error"
    })
  } finally {
    set(isSaving, false)
  }
}

const formFields: Array<FormFieldInterface<Schema>> = [
  { label: "Logo", key: "logo", type: "image", class: "col-span-2" },
  { label: "Name", key: "name", type: "text", required: true, class: "col-span-2" },
  { label: "Short Name", key: "short_name", type: "text" },
  { label: "Abbreviation", key: "code", type: "text", required: true },
  {
    label: "Team Type",
    key: "type",
    type: "radio",
    items: Object.entries(TEAM_TYPE_MAPPING).map(([key, value]) => ({ label: value, value: key })),
    valueKey: "value",
    labelKey: "label",
    required: true
  },
  { label: "Founded", key: "founded", type: "text", subType: "number" },
  { label: "Nicknames", key: "nicknames", type: "tags", class: "col-span-2" },
  { label: "Colours", key: "colours", type: "tags", class: "col-span-2" },
  { label: "Country", key: "country", type: "country" },
  { label: "Home Venue", key: "home_venue", type: "venue" },
  { label: "Website", key: "website", type: "textarea", class: "col-span-2" }
]
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    :title="`Create ${state.name || 'Team'}`"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        :title="`Error creating ${state.name}`"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="team-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            v-model="state"
            :field
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="team-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
