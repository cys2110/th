<script setup lang="ts">
import { ICONS, prettifyJson } from "#imports"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const { countries, fetchCountries } = useCountryList()
const isDeleting = ref(false)
const response = ref<Array<CountryType> | null>()
const error = ref()

const targetItems = ref<Array<CountryType>>([])
const targetSelection = ref<Array<CountryType>>([])
const sourceSelection = ref<Array<CountryType>>([])

const sourceItems = computed(() => countries.value.filter(country => !targetItems.value.some(t => t.id === country.id)))

const transferSelected = () => {
  set(targetItems, [...targetItems.value, ...sourceSelection.value])
  set(sourceSelection, [])
}

const removeSelected = () => {
  set(
    targetItems,
    targetItems.value.filter(country => targetSelection.value.some(item => country.id === item.id))
  )
  set(targetSelection, [])
}

const onDelete = async () => {
  set(isDeleting, true)

  try {
    const { data, error: deleteError } = await supabase
      .schema("tennis")
      .from("country")
      .delete()
      .in(
        "id",
        targetItems.value.map(country => country.id)
      )
      .select("*")

    if (deleteError) {
      set(error, deleteError.message)
    } else {
      set(targetItems, [])
      set(targetSelection, [])
      set(sourceSelection, [])
      fetchCountries()
      set(response, data)
    }
  } finally {
    set(isDeleting, false)
  }
}
</script>

<template>
  <div class="flex gap-6 items-start">
    <u-card class="basis-2/3">
      <template #header>
        <div class="font-semibold">Delete Countries</div>
      </template>

      <div class="flex items-stretch gap-4 w-full">
        <div class="flex flex-col flex-1 gap-1">
          <span class="text-sm font-medium">Countries</span>

          <u-listbox
            v-model="sourceSelection"
            :items="sourceItems"
            multiple
            filter
            label-key="name"
            class="size-full"
          />
        </div>

        <div class="flex flex-col items-center justify-center gap-1">
          <u-button
            :icon="ui.icons.chevronDoubleLeft"
            color="neutral"
            variant="outline"
            :disabled="!targetItems.length"
            @click="removeSelected"
          />

          <u-button
            :icon="ui.icons.chevronDoubleRight"
            color="neutral"
            variant="outline"
            :disabled="!sourceItems.length"
            @click="transferSelected"
          />
        </div>

        <div class="flex flex-col flex-1 gap-1">
          <span class="text-sm font-medium text-highlighted">Selected</span>

          <UListbox
            v-model="targetSelection"
            :items="targetItems"
            multiple
            filter
            label-key="name"
            class="size-full"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <u-button
            color="error"
            :icon="ui.icons.error"
            label="Delete"
            @click="onDelete"
            :loading="isDeleting"
            :disabled="isDeleting || !targetItems.length"
            block
          />

          <u-button
            color="info"
            label="Refresh Countries"
            block
            :icon="ICONS.download"
            @click="fetchCountries"
          />
        </div>
      </template>
    </u-card>

    <div class="space-y-6 basis-1/3">
      <u-alert
        v-if="error"
        color="error"
        variant="subtle"
        title="Error deleting countries"
        :description="error"
      />

      <u-page-card
        v-if="response"
        title="Response"
      >
        <prose-code class="w-full">
          <pre v-html="prettifyJson(response)" />
        </prose-code>
      </u-page-card>
    </div>
  </div>
</template>
