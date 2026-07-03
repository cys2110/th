<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { array, number, object, string, z } from "zod"

const schema = object({
  relationship: string(),
  entry: object({
    id: string(),
    event_id: string(),
    match_type: MatchTypeEnum.nullable(),
    tour: TourEnum.nullable(),
    players: array(
      object({
        id: string(),
        first_name: string(),
        last_name: string(),
        full_name: string(),
        country: object({
          id: string(),
          name: string(),
          continent: ContinentEnum,
          alpha_2: string().nullable(),
          icon: string()
        })
      })
    ),
    label: string()
  }),
  tour: TourEnum.optional(),
  match_type: MatchTypeEnum,
  draw: DrawEnum,
  status: StatusEnum.optional(),
  rank: number().optional(),
  reason: string().optional(),
  player_id: string().optional()
})
type Schema = z.infer<typeof schema>

const emits = defineEmits<{ refresh: [] }>()

const {
  params: { edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()
const form = useTemplateRef("form")

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value),
  ctrl_r: () => set(state, {}),
  ctrl_enter: () => form.value?.submit()
})

const { entries, pending, fetchEntries } = useEntryList(Number(edId))

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  set(state, {})
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, event.errors)

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)
  set(errors, undefined)

  let error

  switch (event.data.relationship) {
    case "Last Direct Acceptance":
      const { error: ldaError } = await supabase.from("ldas").insert({
        event_id: event.data.entry.event_id,
        entry_id: event.data.entry.id,
        draw: event.data.draw,
        rank: event.data.rank
      })

      if (ldaError) error = ldaError
      break
    case "Status":
      const { error: statusError } = await supabase.from("entry_status").insert({
        event_id: event.data.entry.event_id,
        entry_id: event.data.entry.id,
        status: event.data.status!,
        draw: event.data.draw
      })

      if (statusError) error = statusError
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

      const { error: withdrawalError } = await supabase.from(mapping[event.data.relationship as keyof typeof mapping]).insert({
        event_id: event.data.entry.event_id,
        entry_id: event.data.entry.id,
        draw: event.data.draw,
        reason: event.data.reason,
        player_id: event.data.player_id
      })

      if (withdrawalError) {
        error = withdrawalError
      } else {
        if (event.data.relationship !== "Withdrawal") {
          const { error: updateMatchError } = await supabase
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
            error = updateMatchError
          }
        }
      }
      break
    default:
      toast.add({
        title: "Invalid entry info type",
        icon: icons.error,
        color: "error"
      })
      break
  }

  if (error) {
    set(errors, error)
    set(isUploading, false)
    return
  }

  toast.add({
    title: `${event.data.relationship} successfully created!`,
    icon: icons.success,
    color: "success"
  })

  emits("refresh")
  handleReset()
  set(isOpen, false)
  set(isUploading, false)
}
</script>

<template>
  <u-modal
    title="Create Entry Info"
    v-model:open="isOpen"
  >
    <u-button :icon="icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        title="Error saving round"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="entry-info-form"
        ref="form"
        :schema
        :state="state"
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <u-form-field
          name="relationship"
          label="Info Type"
          required
        >
          <u-input-menu
            v-model="state.relationship"
            :items="['Status', 'Default', 'Last Direct Acceptance', 'Retirement', 'Walkover', 'Withdrawal']"
            placeholder="Select info type"
            clear
            class="w-full"
          />
        </u-form-field>

        <div
          class="grid items-center gap-3"
          :class="tournamentStore.tours.length > 1 ? 'grid-cols-3' : 'grid-cols-2'"
        >
          <u-form-field
            v-if="tournamentStore.tours.length > 1"
            name="tour"
            label="Tour"
            required
          >
            <u-radio-group
              v-model="state.tour"
              :items="tournamentStore.tours"
              orientation="horizontal"
              loop
            />
          </u-form-field>

          <u-form-field
            name="match_type"
            label="S/D"
            required
          >
            <u-radio-group
              v-model="state.match_type"
              :items="[...MATCH_TYPES]"
              orientation="horizontal"
              loop
            />
          </u-form-field>

          <u-form-field
            name="draw"
            label="Draw"
            required
          >
            <u-radio-group
              v-model="state.draw"
              :items="[...DRAW_TYPES]"
              orientation="horizontal"
              loop
            />
          </u-form-field>
        </div>

        <div class="grid grid-cols-2 items-center gap-3">
          <u-form-field
            name="entry_id"
            label="Entry"
            required
            class="col-span-2"
          >
            <u-input-menu
              v-model="state.entry"
              :items="
                entries.filter(entry => {
                  const isMatchTypeMatch = !state.match_type || state.match_type === entry.match_type
                  const isTourMatch = !state.tour || state.tour === entry.tour
                  return isMatchTypeMatch && isTourMatch
                })
              "
              :placeholder="`Select ${state.match_type === 'Doubles' ? 'Team' : 'Player'}`"
              :loading="pending"
              label-key="label"
              clear
              :ui="{
                root: 'w-full',
                base: state.entry && state.match_type === 'Doubles' ? 'pl-10' : '',
                itemLabel: state.match_type === 'Doubles' ? 'ml-8' : 'ml-4'
              }"
            >
              <template #leading="{ modelValue }">
                <u-icon
                  v-if="modelValue"
                  v-for="(player, index) in modelValue.players"
                  :key="player.id"
                  :name="player.country?.icon"
                  class="absolute size-4 rounded-sm"
                  :class="{ 'z-10 left-5': index === 1 }"
                />

                <u-icon
                  v-else
                  :name="ICONS.player"
                />
              </template>

              <template #item-leading="{ item }">
                <div class="relative">
                  <u-icon
                    v-for="(player, index) in item.players"
                    :key="player.id"
                    :name="player.country?.icon"
                    class="absolute size-4 rounded-sm"
                    :class="{ 'z-10 left-3': index === 1 }"
                  />
                </div>
              </template>

              <template #content-bottom>
                <u-button
                  :icon="icons.reload"
                  label="Refresh"
                  block
                  @click="fetchEntries"
                />
              </template>
            </u-input-menu>
          </u-form-field>

          <u-form-field
            v-if="state.relationship === 'Last Direct Acceptance'"
            name="rank"
            label="Rank"
            class="col-span-2"
          >
            <form-input-number
              v-model="state.rank"
              placeholder="Enter rank"
            />
          </u-form-field>

          <u-form-field
            v-else-if="state.relationship === 'Status'"
            name="status"
            label="Status"
            class="col-span-2"
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
            <u-form-field
              name="reason"
              label="Reason"
            >
              <form-input
                v-model="state.reason"
                placeholder="Enter reason"
              />
            </u-form-field>

            <u-form-field
              name="player_id"
              label="Player"
            >
              <u-input-menu
                v-model="state.player_id"
                :items="state.entry?.players || []"
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
