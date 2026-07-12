<script setup lang="ts">
import { any, boolean, object, string, z } from "zod"
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
  title: CoachRoleEnum,
  start_date: any().optional(),
  end_date: any().optional(),
  affiliation: boolean()
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const props = defineProps<{ federationId: string | null }>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("team")
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

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
    const { nationality, birth_country, title, start_date, end_date, affiliation, dob, dod, ...rest } = event.data

    const { data, error } = await supabase
      .from("people")
      .insert({
        ...rest,
        nationality_country_id: nationality?.id,
        birth_country_id: birth_country?.id,
        dob: dob?.toString(),
        dod: dod?.toString()
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
      return
    }

    const { error: coachError } = await supabase.from("team_coach_tenure").insert({
      team_id: route.params.id,
      person_id: data[0]!.id,
      title,
      start_date: start_date?.toString(),
      end_date: end_date?.toString()
    })

    if (coachError) {
      console.error("Error creating team coach tenure:", coachError)
      set(errors, coachError)
      return
    }

    if (affiliation && props.federationId) {
      const { error: affiliationError } = await supabase.from("person_na_affiliation").insert({
        person_id: data[0]!.id,
        national_association_id: props.federationId,
        affiliation_type: "coach_appointment",
        start_year: start_date?.toDate("UTC").getFullYear(),
        end_year: end_date?.toDate("UTC").getFullYear()
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

const formFields: Array<FormFieldInterface<Schema>> = [
  { label: "First Name", key: "first_name", type: "text", required: true },
  { label: "Last Name", key: "last_name", type: "text", required: true },
  { label: "Date of Birth", key: "dob", type: "date" },
  { label: "Date of Death", key: "dod", type: "date" },
  { label: "Nationality", key: "nationality", type: "slot", class: "col-span-2" },
  { label: "Birth Place", key: "birth_place", type: "text" },
  { label: "Country of Birth", key: "birth_country", type: "slot" },
  { label: "Affiliation", key: "affiliation", type: "switch" },
  {
    label: "Title",
    key: "title",
    type: "inputMenu",
    items: Object.entries(COACH_ROLE_MAPPING).map(([key, value]) => ({ label: value, value: key })),
    required: true,
    valueKey: "value"
  },
  { label: "Start Date", key: "start_date", type: "date" },
  { label: "End Date", key: "end_date", type: "date" }
]
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    :title="`Create ${state.first_name ? `${state.first_name} ${state.last_name || ''}` : 'Coach'}`"
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
        id="coach-form"
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
        form="coach-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
