<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { any, array, coerce, object, string, url, z } from "zod"
import { set } from "@vueuse/core"
import { deburr, snakeCase } from "lodash"

const schema = object({
  name: string().min(1, "Tournament name is required."),
  mens_id: coerce.number().int("Men's tournament ID must be an integer").positive("Men's tournament ID must be positive").optional(),
  womens_id: coerce.number().int("Women's tournament ID must be an integer").positive("Women's tournament ID must be positive").optional(),
  tours: array(TourEnum).default([]),
  established: any().optional(),
  abolished: any().optional(),
  website: url("Website must be a valid URL.").optional(),
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
    .optional()
}).superRefine((data, ctx) => {
  if (!data.mens_id && (data.tours.includes("ATP") || data.tours.includes("ITF-M"))) {
    ctx.addIssue({
      code: "custom",
      path: ["mens_id"],
      message: "Men's tournament ID is required."
    })
  }

  if (!data.womens_id && (data.tours.includes("WTA") || data.tours.includes("ITF-W"))) {
    ctx.addIssue({
      code: "custom",
      path: ["womens_id"],
      message: "Women's tournament ID is required."
    })
  }
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

const isOpen = ref(false)
const isUploading = ref(false)

const state = ref<Partial<SchemaInput>>({})

const handleReset = () => {
  set(state, {})
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
    const { abolished, established, logo, ...rest } = event.data

    let logo_url: string | undefined

    // Upload to storage if a logo is selected
    if (logo) {
      const { data, error } = await supabase.storage.from("tennis").upload(`tournaments/${deburr(snakeCase(rest.name))}`, logo, {
        cacheControl: "3600",
        upsert: true
      })

      if (error) {
        console.error("Error uploading tournament logo:", error)
        throw Error
      }

      const { data: publicUrlData } = supabase.storage.from("tennis").getPublicUrl(data.path)
      logo_url = publicUrlData.publicUrl
    }

    const { data, error } = await supabase
      .schema("tennis")
      .from("tournament")
      .insert({ ...rest, abolished: abolished?.year, established: established?.year, logo_url })
      .select("id")

    if (error || !data) {
      console.error("Error creating tournament:", error)
      throw Error
    }

    handleReset()
    set(isOpen, false)

    router.push({
      name: "tournament",
      params: { id: data[0]!.id, name: kebabCase(event.data.name) }
    })
  } catch (error) {
    toast.add({
      title: "Error creating tournament",
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
      { label: "Logo", key: "logo", type: "image", class: "col-span-4" },
      { label: "Name", key: "name", type: "text", required: true, class: "col-span-4" },
      { label: "Tours", key: "tours", type: "checkbox", items: TOUR_OPTIONS, required: true, icon: ICONS.tour, class: "col-span-2" },
      { label: "Men's ID", key: "mens_id", type: "text", disabled: state.value.tours?.includes("ATP") && state.value.tours?.includes("ITF-M") },
      { label: "Women's ID", key: "womens_id", type: "text", disabled: state.value.tours?.includes("WTA") && state.value.tours?.includes("ITF-W") },
      { label: "Established", key: "established", type: "calendar", description: "Year the tournament was established", class: "col-span-2" },
      { label: "Abolished", key: "abolished", type: "calendar", description: "Year the tournament was abolished", class: "col-span-2" },
      { label: "Website", key: "website", type: "textarea", class: "col-span-4" }
    ] as Array<FormFieldInterface<Schema>>
)
</script>

<template>
  <u-modal
    :title="`Create ${state.name || 'Tournament'}`"
    v-model:open="isOpen"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-form
        id="tournament-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-4 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="tournament-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
