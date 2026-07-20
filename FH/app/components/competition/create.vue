<script setup lang="ts">
import { boolean, number, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "~/utils/variables"
import { ICONS } from "#imports"
import { deburr, kebabCase } from "lodash"

const schema = object({
  name: string().min(1, "Name is required"),
  code: string().optional(),
  type: CompetitionTypeEnum,
  category: CompetitionCategoryEnum,
  division_level: number().int("Division level must be an integer").optional(),
  national_association: object({
    id: string()
  }).optional(),
  confederation_id: string().optional(),
  fifa_governed: boolean(),
  emblem: z
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
  promotion: object({
    id: string()
  }).optional(),
  relegation: object({
    id: string()
  }).optional()
}).superRefine((data, ctx) => {
  if (data.fifa_governed && data.national_association?.id) {
    ctx.addIssue({
      path: ["national_association.id"],
      code: "custom",
      message: "FIFA governed competitions cannot have a national association"
    })
  }

  if (data.fifa_governed && data.confederation_id) {
    ctx.addIssue({
      path: ["confederation_id"],
      code: "custom",
      message: "FIFA governed competitions cannot have a confederation"
    })
  }

  if (data.promotion && data.relegation && data.promotion.id === data.relegation.id) {
    ctx.addIssue({
      path: ["relegation"],
      code: "custom",
      message: "Promotion and relegation cannot be the same competition"
    })
  }
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const confederationList = useConfederationList()
const federationSearch = useFederationSearch()

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>({ fifa_governed: false })

const handleReset = () => {
  set(state, { fifa_governed: false })
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, JSON.stringify(event.errors))

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  try {
    const { national_association, emblem, promotion, relegation, ...rest } = event.data

    let emblemUrl: string | undefined

    // Upload to storage if a logo is selected
    if (emblem) {
      const { data, error } = await supabase.storage.from("football").upload(`competitions/${deburr(rest.name)}`, emblem, {
        cacheControl: "3600",
        upsert: true
      })

      if (error) {
        toast.add({
          title: `Error uploading emblem for ${event.data.name}`,
          icon: ui.icons.error,
          color: "error"
        })
        throw new Error(`Error uploading emblem for ${event.data.name}: ${error.message}`)
      }

      const { data: publicUrlData } = supabase.storage.from("football").getPublicUrl(data.path)
      emblemUrl = publicUrlData.publicUrl
    }

    const { data, error } = await supabase
      .from("competition")
      .insert({
        ...rest,
        national_association_id: national_association?.id,
        promotion_id: promotion?.id,
        relegation_id: relegation?.id,
        emblem_url: emblemUrl
      })
      .select("id")

    toast.add({
      title: error ? `Error creating ${event.data.name}` : `${event.data.name} successfully created!`,
      icon: ui.icons[error ? "error" : "success"],
      color: error ? "error" : "success"
    })

    if (error) {
      throw new Error(`Error creating competition: ${error.message}`)
    }

    handleReset()
    set(isOpen, false)
    router.push({ name: "competition", params: { id: data[0]!.id, name: kebabCase(event.data.name) } })
  } catch (error) {
    console.error(error)
    set(errors, error)
  } finally {
    set(isSaving, false)
  }
}

const formFields = computed<Array<FormFieldInterface<Schema>>>(() => {
  const fields: Array<FormFieldInterface<Schema>> = [
    { label: "Emblem", key: "emblem", type: "image", class: "col-span-2" },
    { label: "Name", key: "name", type: "text", required: true },
    { label: "Code", key: "code", type: "text" },
    {
      label: "Category",
      key: "category",
      type: "radio",
      items: Object.entries(COMPETITION_CATEGORY_MAPPING).map(([key, value]) => ({ label: value, value: key })),
      valueKey: "value",
      labelKey: "label",
      required: true,
      class: "col-span-2"
    },
    {
      label: "Type",
      key: "type",
      type: "radio",
      items: Object.entries(COMPETITION_TYPE_MAPPING).map(([key, value]) => ({ label: value, value: key })),
      valueKey: "value",
      labelKey: "label",
      required: true,
      class: "col-span-2"
    },
    { label: "Division Level", key: "division_level", type: "number" },
    { label: "FIFA Governed", key: "fifa_governed", type: "switch" }
  ]

  if (!state.value.fifa_governed) {
    fields.push(
      {
        label: "Confederation",
        key: "confederation_id",
        type: "inputMenu",
        items: confederationList.confederations.value,
        loading: confederationList.pending.value,
        valueKey: "id",
        labelKey: "id"
      },
      { label: "National Association", key: "national_association", type: "slot" }
    )
  }

  return fields
})
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    :title="`Create ${state.name || 'Competition'}`"
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
        id="competition-form"
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
            <u-input-menu
              v-if="field.key === 'national_association'"
              v-model="<any>state.national_association"
              v-model:search-term="federationSearch.searchTerm.value"
              :loading="federationSearch.pending.value"
              clear
              placeholder="National Association"
              :items="federationSearch.federations.value"
              class="w-full"
              label-key="name"
            >
              <template #leading="{ modelValue }">
                <u-icon :name="modelValue?.country.icon || ICONS.globe" />
              </template>

              <template #item-leading="{ item }">
                <u-icon :name="item.country.icon" />
              </template>
            </u-input-menu>
          </form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="competition-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
