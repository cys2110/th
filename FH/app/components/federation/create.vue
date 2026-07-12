<script setup lang="ts">
import { boolean, number, object, string, url, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "~/utils/variables"
import { ICONS } from "#imports"
import { deburr } from "lodash"

const schema = object({
  name: string().min(1, "Name is required"),
  headquarters: string().min(1, "Headquarters is required"),
  country: object(
    {
      id: string(),
      name: string(),
      icon: string()
    },
    "Country is required"
  ),
  confederation_id: string().min(1, "Confederation is required"),
  fifa_member: boolean(),
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
  founded: number().int("Founded year must be an integer").positive("Founded year must be positive").optional(),
  short_name: string().optional()
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const emits = defineEmits<{ refresh: [] }>()

const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const confederationList = useConfederationList()
const countryList = useCountryList()

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>({
  fifa_member: false
})

const handleReset = () => {
  set(state, { fifa_member: false })
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, JSON.stringify(event.errors))

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  const { country, logo, ...rest } = event.data
  let logoUrl: string | undefined

  // Upload to storage if a logo is selected
  if (logo) {
    const { data, error } = await supabase.storage.from("football").upload(`federations/${deburr(rest.name)}`, logo, {
      cacheControl: "3600",
      upsert: true
    })

    if (error) {
      toast.add({
        title: `Error uploading logo for ${event.data.name}`,
        icon: ui.icons.error,
        color: "error"
      })
      console.error("Error uploading federation logo:", error)
      set(errors, error)
      set(isSaving, false)
      return
    }

    const { data: publicUrlData } = supabase.storage.from("football").getPublicUrl(data.path)
    logoUrl = publicUrlData.publicUrl
  }

  const { error } = await supabase.from("national_association").insert({ ...rest, country_id: country.id, logo_url: logoUrl })

  toast.add({
    title: error ? `Error creating ${event.data.name}` : `${event.data.name} successfully created!`,
    icon: ui.icons[error ? "error" : "success"],
    color: error ? "error" : "success"
  })

  if (error) {
    console.error("Error creating federation:", error)
    set(errors, error)
  } else {
    handleReset()
    emits("refresh")
    set(isOpen, false)
  }

  set(isSaving, false)
}

const formFields: Array<FormFieldInterface<Schema>> = [
  { label: "Logo", key: "logo", type: "slot", class: "col-span-2" },
  { label: "Name", key: "name", type: "text", required: true, class: "col-span-2" },
  { label: "Short Name", key: "short_name", type: "text" },
  { label: "Founded", key: "founded", type: "text", subType: "number" },
  { label: "Headquarters", key: "headquarters", type: "text", required: true },
  { label: "Country", key: "country", type: "slot", required: true },
  { label: "Confederation", key: "confederation_id", type: "slot", required: true },
  { label: "FIFA Member", key: "fifa_member", type: "switch" },
  { label: "Website", key: "website", type: "textarea", class: "col-span-2" }
]
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    :title="`Create ${state.name || 'Federation'}`"
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
        id="federation-form"
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
          >
            <u-file-upload
              v-if="field.key === 'logo'"
              v-model="state.logo"
              accept="image/*"
              label="Drop your image here"
            />

            <u-input-menu
              v-if="field.key === 'confederation_id'"
              v-model="state.confederation_id"
              :items="confederationList.confederations.value"
              :loading="confederationList.pending.value"
              value-key="id"
              label-key="name"
              placeholder="Confederation"
              class="w-full"
            />

            <u-input-menu
              v-if="field.key === 'country'"
              v-model="<any>state.country"
              :items="countryList.countries.value"
              :loading="countryList.pending.value"
              label-key="name"
              placeholder="Country"
              class="w-full"
            >
              <template #leading="{ modelValue }">
                <u-icon :name="modelValue?.icon || ICONS.globe" />
              </template>
            </u-input-menu>
          </form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="federation-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
