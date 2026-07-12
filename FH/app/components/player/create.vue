<script setup lang="ts">
import { any, boolean, coerce, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const schema = object({
  first_name: string().min(1, "First name is required"),
  last_name: string().min(1, "Last name is required"),
  dob: any().optional(),
  dod: any().optional(),
  nationality: object({
    id: string(),
    name: string(),
    icon: string()
  }).optional(),
  birth_place: string().optional(),
  birth_country: object({
    id: string(),
    name: string(),
    icon: string()
  }).optional(),
  federation: object({
    id: string(),
    name: string(),
    country: object({
      id: string(),
      name: string(),
      icon: string()
    })
  }).optional(),
  affiliation: boolean(),
  aka: string().optional(),
  height_cm: coerce.number().optional(),
  preferred_foot: PreferredFootEnum.optional()
}).superRefine((data, ctx) => {
  if (data.affiliation && !data.federation) {
    ctx.addIssue({
      path: ["federation"],
      code: "custom",
      message: "Affiliation requires a federation"
    })
  }
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const emits = defineEmits<{ refresh: [] }>()

const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const federationSearch = useFederationSearch()

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>({
  affiliation: false
})

const handleReset = () => {
  set(state, { affiliation: false })
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, JSON.stringify(event.errors))

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  try {
    const { federation, affiliation, aka, height_cm, preferred_foot, dob, dod, nationality, birth_country, ...rest } = event.data

    const { data, error } = await supabase
      .from("people")
      .insert({
        ...rest,
        dob: dob?.toString(),
        dod: dod?.toString(),
        nationality_country_id: nationality?.id,
        birth_country_id: birth_country?.id
      })
      .select("id")

    toast.add({
      title:
        error ?
          `Error creating ${event.data.first_name} ${event.data.last_name}`
        : `${event.data.first_name} ${event.data.last_name} successfully created!`,
      icon: ui.icons[error ? "error" : "success"],
      color: error ? "error" : "success"
    })

    if (error) {
      console.error("Error creating person:", error)
      set(errors, error)
    }

    const { error: playerError } = await supabase.from("player").insert({
      person_id: data![0]!.id,
      aka,
      height_cm,
      preferred_foot
    })

    if (playerError) {
      console.error("Error creating player:", playerError)
      set(errors, playerError)
      return
    }

    if (affiliation) {
      const { error: affiliationError } = await supabase.from("person_na_affiliation").insert({
        person_id: data![0]!.id,
        national_association_id: federation!.id,
        affiliation_type: "player_allegiance"
      })

      if (affiliationError) {
        console.error("Error creating person affiliation:", affiliationError)
        set(errors, affiliationError)
        return
      }
    }

    handleReset()
    emits("refresh")
    set(isOpen, false)
  } finally {
    set(isSaving, false)
  }
}

const formFields = computed<Array<FormFieldInterface<Schema>>>(
  () =>
    [
      { label: "First Name", key: "first_name", type: "text", required: true },
      { label: "Last Name", key: "last_name", type: "text", required: true },
      { label: "Alias", key: "aka", type: "text" },
      { label: "Nationality", key: "nationality", type: "slot" },
      { label: "Date of Birth", key: "dob", type: "date" },
      { label: "Date of Death", key: "dod", type: "date" },
      { label: "Birth Place", key: "birth_place", type: "text" },
      { label: "Country of Birth", key: "birth_country", type: "slot" },
      { label: "Height (cm)", key: "height_cm", type: "number" },
      {
        label: "Preferred Foot",
        key: "preferred_foot",
        type: "radio",
        items: Object.values(PREFERRED_FOOT_MAPPING).map(value => ({ label: value, value })),
        valueKey: "value"
      },
      { label: "Affiliation", key: "affiliation", type: "switch" },
      ...(state.value.affiliation ? [{ label: "Federation", key: "federation", type: "slot" }] : [])
    ] as Array<FormFieldInterface<Schema>>
)
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    :title="`Create ${state.first_name ? `${state.first_name} ${state.last_name || ''}` : 'Player'}`"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        :title="`Error creating ${state.first_name} ${state.last_name}`"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="player-form"
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
              placeholder="Federation"
              :items="federationSearch.federations.value"
              class="w-full"
              label-key="name"
            >
              <template #leading="{ modelValue }">
                <u-icon
                  v-if="modelValue"
                  :name="modelValue.country.icon"
                />
              </template>

              <template #item-leading="{ item }">
                <u-icon :name="item.country.icon" />
              </template>
            </u-input-menu>

            <country-search
              v-if="field.key === 'nationality'"
              v-model="<any>state.nationality"
            />

            <country-search
              v-if="field.key === 'birth_country'"
              v-model="<any>state.birth_country"
            />
          </form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="player-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
