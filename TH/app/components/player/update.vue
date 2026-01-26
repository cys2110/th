<script setup lang="ts">
import { parseDate, CalendarDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const props = defineProps<{
  player: PlayerDetailsType
}>()

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()

const playerStore = usePlayerStore()

const isOpen = ref(false)
const isUploading = ref(false)

const initialState = {
  ...props.player,
  tour: playerStore.tour,
  country:
    props.player.country ?
      {
        id: {
          value: props.player.country.id,
          label: props.player.country.name
        },
        dates: {
          start_date: props.player.country.start_date ? parseDate(props.player.country.start_date) : null
        }
      }
    : {
        id: null,
        dates: {
          start_date: null
        }
      },
  former_countries:
    props.player.former_countries?.length ?
      props.player.former_countries.map(c => ({
        id: {
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
        id: { value: c.id, label: `${c.first_name} ${c.last_name}` },
        dates: { years: c.years }
      }))
    : [],
  former_coaches:
    props.player.former_coaches?.length ?
      props.player.former_coaches.map(c => ({
        id: { value: c.id, label: `${c.first_name} ${c.last_name}` },
        dates: { years: c.years }
      }))
    : []
}

const state = ref<Partial<PlayerFormSchema>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<PlayerFormSchema>) => {
  set(isUploading, true)

  await $fetch("/api/player/update", {
    method: "POST",
    body: event.data
  })
    .then(async response => {
      console.info(response.statusObjects)

      toast.add({
        title: response.message,
        icon: response.success ? icons.success : icons.error,
        color: response.success ? "success" : "error"
      })

      if (response.success) {
        reloadNuxtApp()
      }
    })
    .catch(error => {
      if (error.statusMessage) {
        console.error(error.statusMessage, error.data?.data)
      } else {
        console.error(error)
      }

      toast.add({
        title: `Error updating ${event.data.first_name} ${event.data.last_name}.`,
        description: error.statusMessage ?? "An unknown error occurred.",
        icon: icons.error,
        color: "error"
      })
    })
    .finally(() => set(isUploading, false))
}
</script>

<template>
  <u-modal
    :title="player.first_name ? `${player.first_name} ${player.last_name}` : player.id"
    v-model:open="isOpen"
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
        class="space-y-3"
      >
        <u-form-field
          label="Name"
          :error-pattern="/^(first_name|last_name)$/"
          required
          :ui="{ label: 'text-xs' }"
        >
          <u-field-group>
            <form-input
              placeholder="First Name"
              v-model="state.first_name"
              :icon="ICONS.player"
            />

            <form-input
              placeholder="Last Name"
              v-model="state.last_name"
            />
          </u-field-group>
        </u-form-field>

        <u-form-field
          label="Dates"
          :error-pattern="/^(dob|dod)$/"
          :ui="{ label: 'text-xs' }"
        >
          <u-field-group>
            <form-date-picker v-model="<CalendarDate>state.dob" />

            <form-date-picker v-model="<CalendarDate>state.dod" />
          </u-field-group>
        </u-form-field>

        <u-form-field
          label="Height"
          name="height"
          hint="Enter in centimetres"
          :ui="{ label: 'text-xs' }"
        >
          <u-field-group>
            <form-input-number
              placeholder="Height"
              v-model="state.height"
              :icon="ICONS.height"
            />
            <u-badge
              label="cm"
              color="neutral"
              variant="outline"
            />
          </u-field-group>
        </u-form-field>

        <u-form
          :schema="playerFormSchema.shape.country"
          name="country"
          nested
        >
          <u-form-field
            label="Country"
            :error-pattern="/^(id|dates\.start_date)$/"
            :ui="{ label: 'text-xs' }"
          >
            <u-field-group>
              <form-countries v-model="<OptionType>state.country!.id" />

              <form-date-picker v-model="<CalendarDate>state.country!.dates.start_date" />
            </u-field-group>
          </u-form-field>
        </u-form>

        <u-form
          v-for="(country, index) in state.former_countries"
          :key="index"
          :schema="playerFormSchema.shape.former_countries"
          :name="`former_countries.${index}`"
          nested
        >
          <u-form-field
            :label="!index ? 'Former Representations' : undefined"
            :error-pattern="/^(id|dates\.start_date|dates\.end_date)$/"
            :ui="{ label: 'text-xs' }"
          >
            <u-field-group>
              <form-countries v-model="country.id" />

              <form-dates-picker v-model="<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>country.dates" />

              <u-button
                :icon="icons.close"
                @click="state.former_countries!.splice(index, 1)"
                color="error"
              />
            </u-field-group>
          </u-form-field>
        </u-form>
        <u-button
          block
          @click="state.former_countries!.push({ id: { value: '', label: '' }, dates: { start: undefined, end: undefined } })"
          :icon="icons.plus"
          label="Add Former Representation"
        />

        <u-form-field
          label="Pro Years"
          :error-pattern="/^(turned_pro|retired)$/"
          :ui="{ label: 'text-xs' }"
        >
          <u-field-group>
            <form-input
              type="number"
              placeholder="Turned Pro"
              v-model="state.turned_pro"
              :icon="ICONS.years"
            />

            <form-input
              type="number"
              placeholder="Retired"
              v-model="state.retired"
            />
          </u-field-group>
        </u-form-field>

        <u-form-field
          label="Hall of Fame Induction"
          name="hof"
          hint="Year inducted"
          :ui="{ label: 'text-xs' }"
        >
          <form-input
            type="number"
            placeholder="Hall of Fame Induction"
            v-model="state.hof"
            :icon="ICONS.racquet"
          />
        </u-form-field>

        <div class="grid grid-cols-2">
          <u-form-field
            label="Plays"
            name="rh"
            :ui="{ label: 'text-xs' }"
          >
            <u-radio-group
              :items="['Right', 'Left']"
              v-model="state.rh"
              orientation="horizontal"
              loop
            />
          </u-form-field>

          <u-form-field
            label="Backhand"
            name="bh"
            :ui="{ label: 'text-xs' }"
          >
            <u-radio-group
              :items="['One', 'Two']"
              v-model="state.bh"
              orientation="horizontal"
              loop
            />
          </u-form-field>
        </div>

        <u-form-field
          label="Wikipedia Link"
          name="wiki_link"
          :ui="{ label: 'text-xs' }"
        >
          <form-textarea
            placeholder="Wikipedia URL"
            v-model="state.wiki_link"
            :icon="ICONS.wikipedia"
          />
        </u-form-field>

        <u-form-field
          label="Official Website"
          name="official_link"
          :ui="{ label: 'text-xs' }"
        >
          <form-textarea
            placeholder="Official Website URL"
            v-model="state.official_link"
            icon="material-symbols:globe-book"
          />
        </u-form-field>

        <u-form
          v-for="(coach, index) in state.coaches"
          :key="index"
          :schema="playerFormSchema.shape.coaches"
          :name="`coaches.${index}`"
          nested
        >
          <u-form-field
            :label="!index ? 'Coaches' : undefined"
            :error-pattern="/^(id|dates\.years)$/"
            :ui="{ label: 'text-xs' }"
          >
            <u-field-group>
              <form-search
                type="Coach"
                placeholder="coach"
                :icon="ICONS.coach"
                v-model="coach.id"
              />

              <form-input
                placeholder="Years Coached"
                v-model="coach.dates.years"
              />

              <u-button
                :icon="icons.close"
                @click="state.coaches!.splice(index, 1)"
                color="error"
              />
            </u-field-group>
          </u-form-field>
        </u-form>
        <u-button
          block
          @click="state.coaches!.push({ id: { value: '', label: '' }, dates: { years: '' } })"
          :icon="icons.plus"
          label="Add Coach"
        />

        <u-form
          v-for="(coach, index) in state.former_coaches"
          :key="index"
          :schema="playerFormSchema.shape.former_coaches"
          :name="`former_coaches.${index}`"
          nested
        >
          <u-form-field
            :label="!index ? 'Former Coaches' : undefined"
            :error-pattern="/^(id|dates\.years)$/"
            :ui="{ label: 'text-xs' }"
          >
            <u-field-group>
              <form-search
                type="Coach"
                placeholder="coach"
                :icon="ICONS.coach"
                v-model="coach.id"
              />

              <form-input
                placeholder="Years Coached"
                v-model="coach.dates.years"
              />

              <u-button
                :icon="icons.close"
                @click="state.former_coaches!.splice(index, 1)"
                color="error"
              />
            </u-field-group>
          </u-form-field>
        </u-form>
        <u-button
          block
          @click="state.former_coaches!.push({ id: { value: '', label: '' }, dates: { years: '' } })"
          :icon="icons.plus"
          label="Add Former Coach"
        />
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-field-group>
        <u-button
          form="player-form"
          label="Save"
          color="success"
          block
          :icon="icons.upload"
          :loading="isUploading"
          :loading-icon="ICONS.uploading"
          type="submit"
        />
        <u-button
          label="Reset"
          color="warning"
          block
          :icon="icons.reload"
          @click="handleReset"
        />
        <u-button
          label="Cancel"
          color="error"
          block
          :icon="icons.error"
          @click="close"
        />
      </u-field-group>
    </template>
  </u-modal>
</template>
