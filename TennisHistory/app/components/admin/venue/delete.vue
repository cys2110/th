<script setup lang="ts">
import { prettifyJson } from "#imports"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()

const { venues, pending, searchTerm } = useVenueSearch()

const isDeleting = ref(false)
const response = ref<Array<VenueType> | null>()
const error = ref()

const selectedVenues = ref<Array<VenueType>>([])

const onDelete = async () => {
  set(isDeleting, true)

  try {
    const { data, error: deleteError } = await supabase
      .schema("tennis")
      .from("venue")
      .delete()
      .in(
        "id",
        selectedVenues.value.map(v => v.id)
      )
      .select("*, ...country(icon)")

    if (deleteError) {
      set(error, deleteError.message)
    } else {
      set(selectedVenues, [])
      set(response, data as Array<VenueType>)
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
        <div class="font-semibold">Delete Venues</div>
      </template>

      <u-input-menu
        v-model="selectedVenues"
        v-model:search-term="searchTerm"
        :loading="pending"
        clear
        ignore-filter
        placeholder="Venues"
        :items="venues"
        multiple
        class="w-full"
      >
        <template #tags-item-text="{ item }">
          <div class="flex items-center gap-1">
            <u-icon :name="item.icon" />
            <span v-if="item.name"> {{ item.name }}, {{ item.city }} </span>
            <span v-else>
              {{ item.city }}
            </span>
          </div>
        </template>

        <template #item-leading="{ item }">
          <u-icon :name="item.icon" />
        </template>

        <template #item-label="{ item }">
          {{ item.name || item.city }}
        </template>

        <template #item-description="{ item }">
          <span v-if="item.name">{{ item.city }}</span>
        </template>
      </u-input-menu>

      <template #footer>
        <u-button
          color="error"
          :icon="ui.icons.error"
          label="Delete"
          @click="onDelete"
          :loading="isDeleting"
          :disabled="isDeleting || !selectedVenues.length"
          block
        />
      </template>
    </u-card>

    <div class="space-y-6 basis-1/3">
      <u-alert
        v-if="error"
        color="error"
        variant="subtle"
        title="Error deleting venues"
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
