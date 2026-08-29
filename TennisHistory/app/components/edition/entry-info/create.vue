<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { array, number, object, string, z } from "zod"
import { set } from "@vueuse/core"
import { STATUS_MAPPING } from "#imports"

const schema = object({
  relationship: string(),
  entry: object({
    id: string(),
    event_id: string(),
    label: string(),
    team: array(
      object({
        id: string(),
        full_name: string(),
        image_url: string().nullish()
      })
    )
  }),
  tour: string().optional(),
  match_type: MatchTypeEnum,
  draw: DrawEnumType,
  status: StatusEnumType.optional(),
  rank: number().optional(),
  reason: string().optional(),
  player_id: string().optional()
}).superRefine((data, ctx) => {
  if (data.relationship === "Status" && !data.status) ctx.addIssue({ code: "custom", path: ["status"], message: "Status is required" })
})
type Schema = z.infer<typeof schema>

const emits = defineEmits<{ refresh: [] }>()

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const { ui } = useAppConfig()
const route = useRoute("edition")

const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)

// Get events
const { data: events, pending: eventsPending } = await useAsyncData(
  () => `create-seed-${JSON.stringify(route.params)}`,
  async () => {
    const { data, error } = await supabase
      .schema("tennis")
      .from("events")
      .select("id, tour, editions!inner(id)")
      .eq("editions.tournament_id", route.params.id)
      .eq("editions.year", Number(route.params.year))
      .eq("editions.edition_no", Number(route.params.edition_no))

    if (error) {
      console.error("Error fetching events:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const { entries, pending, fetchEntries } = useEntryList(route.params.id, route.params.year, route.params.edition_no)

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  const { tour, draw, match_type } = state.value
  set(state, { tour, draw, match_type })
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
    switch (event.data.relationship) {
      case "Last Direct Acceptance":
        const { error: ldaError } = await supabase.schema("tennis").from("ldas").insert({
          event_id: event.data.entry.event_id,
          entry_id: event.data.entry.id,
          draw: event.data.draw,
          rank: event.data.rank
        })

        if (ldaError) {
          console.error("Error creating LDA:", ldaError)
          throw Error
        }
        break
      case "Status":
        const { error: statusError } = await supabase.schema("tennis").from("entry_status").insert({
          event_id: event.data.entry.event_id,
          entry_id: event.data.entry.id,
          status: event.data.status!,
          draw: event.data.draw
        })

        if (statusError) {
          console.error("Error creating status:", statusError)
          throw Error
        }
        break
      case "Retirement":
      case "Withdrawal":
      case "Default":
      case "Walkover":
        const mapping = {
          Retirement: "retirements",
          Withdrawal: "withdrawals",
          Default: "defaults",
          Walkover: "walkovers"
        } as const

        const { error: withdrawalError } = await supabase
          .schema("tennis")
          .from(mapping[event.data.relationship as keyof typeof mapping])
          .insert({
            event_id: event.data.entry.event_id,
            entry_id: event.data.entry.id,
            draw: event.data.draw,
            reason: event.data.reason,
            player_id: event.data.player_id
          })

        if (withdrawalError) {
          console.error("Error creating withdrawal:", withdrawalError)
          throw Error
        } else {
          if (event.data.relationship !== "Withdrawal") {
            const { error: updateMatchError } = await supabase
              .schema("tennis")
              .from("matches")
              .update({
                incomplete:
                  event.data.relationship === "Walkover" ? "WO"
                  : event.data.relationship === "Retirement" ? "R"
                  : "D"
              })
              .eq("loser_id", event.data.entry.id)
              .eq("draw", event.data.draw)

            if (updateMatchError) {
              console.error("Error updating matches:", updateMatchError)
              throw Error
            }
          }
        }
        break
      default:
        toast.add({
          title: "Invalid entry info type",
          icon: ui.icons.error,
          color: "error"
        })
        return
    }

    toast.add({
      title: `${event.data.relationship} successfully created!`,
      icon: ui.icons.success,
      color: "success"
    })

    emits("refresh")
    handleReset()
    set(isOpen, false)
  } catch (error) {
    toast.add({
      title: `Error creating ${event.data.relationship}`,
      icon: ui.icons.error,
      color: "error"
    })
  } finally {
    set(isUploading, false)
  }
}
</script>

<template>
  <u-modal
    title="Create Entry Info"
    v-model:open="isOpen"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-form
        id="entry-info-form"
        :schema
        :state="state"
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-4 items-center gap-3">
          <form-field
            v-model="state"
            :field="{
              label: 'Tour',
              key: 'tour',
              type: 'inputMenu',
              items: events,
              valueKey: 'id',
              labelKey: 'tour',
              required: true,
              class: 'col-span-2'
            }"
          />

          <u-form-field
            name="match_type"
            label="S/D"
            required
          >
            <u-radio-group
              :items="['Singles', 'Doubles']"
              v-model="state.match_type"
              loop
            />
          </u-form-field>

          <u-form-field
            name="draw"
            label="Draw"
            required
          >
            <u-radio-group
              :items="['Main', 'Qualifying']"
              v-model="state.draw"
              loop
            />
          </u-form-field>

          <form-field
            v-model="state"
            :field="{
              label: 'Info Type',
              key: 'relationship',
              type: 'inputMenu',
              items: ['Status', 'Default', 'Last Direct Acceptance', 'Retirement', 'Walkover', 'Withdrawal'],
              required: true,
              class: 'col-span-4'
            }"
          />

          <u-form-field
            name="entry"
            :label="state.match_type === 'Doubles' ? 'Team' : 'Player'"
            required
            class="col-span-4"
          >
            <u-input-menu
              v-model="<any>state.entry"
              :items="
                entries.filter(entry => {
                  const isMatchTypeMatch = !state.match_type || state.match_type === entry.match_type
                  const isEventMatch = !state.tour || entry.event_id === state.tour
                  return isMatchTypeMatch && isEventMatch
                })
              "
              :placeholder="`Select ${state.match_type === 'Doubles' ? 'Team' : 'Player'}`"
              :loading="pending"
              label-key="label"
              clear
              class="w-full"
            >
              <template #content-bottom>
                <u-button
                  :icon="ui.icons.reload"
                  label="Refresh"
                  block
                  @click="fetchEntries"
                />
              </template>
            </u-input-menu>
          </u-form-field>

          <form-field
            v-if="state.relationship === 'Last Direct Acceptance'"
            v-model="state"
            :field="{ label: 'Rank', key: 'rank', type: 'number', class: 'col-span-4' }"
          />

          <u-form-field
            v-else-if="state.relationship === 'Status'"
            name="status"
            label="Status"
            class="col-span-4"
          >
            <u-input-menu
              v-model="state.status"
              :items="Object.entries(STATUS_MAPPING).map(([value, label]) => ({ label, value }))"
              value-key="value"
              clear
              placeholder="Select status"
              class="w-full"
            />
          </u-form-field>

          <template v-else>
            <form-field
              v-model="state"
              :field="{ label: 'Reason', key: 'reason', type: 'text', class: 'col-span-2' }"
            />

            <u-form-field
              name="player_id"
              label="Player"
              class="col-span-2"
            >
              <u-input-menu
                v-model="state.player_id"
                :items="state.entry?.team || []"
                value-key="id"
                label-key="full_name"
                clear
                placeholder="Select player"
                class="w-full"
              />
            </u-form-field>
          </template>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="entry-info-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
