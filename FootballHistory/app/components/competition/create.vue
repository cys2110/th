<script setup lang="ts">
import { boolean, coerce, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "~/utils/variables"
import { ICONS } from "#imports"
import { type Tables } from "~/types/database.types"
import { deburr, snakeCase } from "lodash"

type Competition = Tables<{ schema: "football" }, "competition">

const schema = object({
  name: string().min(1, "Name is required"),
  code: string().min(1, "Code is required"),
  type: CompetitionTypeEnum,
  category: CompetitionCategoryEnum,
  division_level: coerce.number().int("Division level must be an integer").optional(),
  federation: object({ id: string() }).optional(),
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
  promotion_id: string().optional(),
  relegation_id: string().optional()
}).superRefine((data, ctx) => {
  if (data.fifa_governed && data.federation?.id) {
    ctx.addIssue({
      path: ["federation", "id"],
      code: "custom",
      message: "FIFA governed competitions cannot also be governed by a federation"
    })
  }

  if (data.fifa_governed && data.confederation_id) {
    ctx.addIssue({
      path: ["confederation_id"],
      code: "custom",
      message: "FIFA governed competitions cannot have also be governed by a confederation"
    })
  }

  if (data.federation?.id && data.confederation_id) {
    ctx.addIssue({
      path: ["federation", "id"],
      code: "custom",
      message: "Federation governed competitions cannot also be governed by a confederation"
    })
  }

  if (data.promotion_id && data.relegation_id && data.promotion_id === data.relegation_id) {
    ctx.addIssue({
      path: ["relegation_id"],
      code: "custom",
      message: "Promotion league and relegation league cannot be the same"
    })
  }
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const props = defineProps<{ competitions: Array<Competition> }>()

const emits = defineEmits<{ refresh: [] }>()

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
    const { federation, emblem, ...rest } = event.data

    let emblemUrl: string | undefined

    // Upload to storage if a logo is selected
    if (emblem) {
      const { data, error } = await supabase.storage.from("football").upload(`competitions/${deburr(snakeCase(rest.name))}`, emblem, {
        cacheControl: "3600",
        upsert: true
      })

      if (error) {
        throw new Error(`Error uploading emblem for ${event.data.name}: ${error.message}`)
      }

      const { data: publicUrlData } = supabase.storage.from("football").getPublicUrl(data.path)
      emblemUrl = publicUrlData.publicUrl
    }

    const { error } = await supabase
      .schema("football")
      .from("competition")
      .insert({
        ...rest,
        federation_id: federation?.id,
        emblem_url: emblemUrl
      })

    if (error) {
      throw new Error(`Error creating competition: ${error.message}`)
    }

    handleReset()
    set(isOpen, false)
    // router.push({ name: "competition", params: { id: data[0]!.id, name: kebabCase(event.data.name) } })
    emits("refresh")
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

const formFields = computed<Array<FormFieldInterface<Schema>>>(() => {
  const fields: Array<FormFieldInterface<Schema>> = [
    { label: "Emblem", key: "emblem", type: "image", class: "col-span-2" },
    { label: "Name", key: "name", type: "text", required: true },
    { label: "Code", key: "code", type: "text", required: true },
    {
      label: "Category",
      key: "category",
      type: "radio",
      items: COMPETITION_CATEGORIES,
      valueKey: "value",
      labelKey: "label",
      required: true,
      class: "col-span-2"
    },
    {
      label: "Type",
      key: "type",
      type: "radio",
      items: COMPETITION_TYPES,
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
        labelKey: "name",
        filterFields: ["id", "name"]
      },
      { label: "National Association", key: "federation", type: "slot" }
    )
  }

  if (state.value.division_level) {
    fields.push(
      {
        label: "Promotion to",
        key: "promotion_id",
        type: "inputMenu",
        items: props.competitions,
        valueKey: "id",
        labelKey: "name"
      },
      {
        label: "Relegation to",
        key: "relegation_id",
        type: "inputMenu",
        items: props.competitions,
        valueKey: "id",
        labelKey: "name"
      }
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
              v-if="field.key === 'federation'"
              v-model="<any>state.federation"
              v-model:search-term="federationSearch.searchTerm.value"
              :loading="federationSearch.pending.value"
              clear
              placeholder="National Association"
              :items="federationSearch.federations.value"
              class="w-full"
              label-key="name"
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
        form="competition-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
