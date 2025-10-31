<script setup lang="ts">
definePageMeta({ name: "player" })
const { viewMode } = useViewMode()
const {
  params: { name }
} = useRoute("player")

const playerName = useState<string>("playerName")
const playerTour = useState<keyof typeof TourEnum | undefined>("playerTour")
</script>

<template>
  <div class="w-full">
    <players-wrapper-cards
      v-if="viewMode === 'cards'"
      v-slot="{ activeYears }"
    >
      <players-details :activeYears />
    </players-wrapper-cards>

    <players-wrapper-table v-else>
      <template #default="{ country, activeYears }">
        <u-page-header
          :headline="playerName ? playerName : capitalCase(name)"
          title="Details"
        >
          <template #description>
            <div class="flex items-center gap-2 w-fit">
              <countries-link
                v-if="country"
                :country
                icon-only
              />
              <u-badge
                :color="activeYears.active ? 'Active' : 'Inactive'"
                :label="activeYears.active ? 'Active' : 'Inactive'"
              />
              <u-badge
                v-if="playerTour"
                :color="playerTour"
                :label="TourEnum[playerTour]"
              />
              <div>
                Years Active: {{ activeYears.activeYears }} ({{ activeYears.numberOfYears }} year{{ activeYears.numberOfYears === 1 ? "" : "s" }})
              </div>
            </div>
          </template>
        </u-page-header>

        <players-details :activeYears />
      </template>
    </players-wrapper-table>
  </div>
</template>
