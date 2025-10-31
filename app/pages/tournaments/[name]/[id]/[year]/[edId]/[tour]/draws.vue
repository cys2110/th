<script setup lang="ts">
definePageMeta({ name: "draws" })
const { viewMode } = useViewMode()
const {
  params: { edId, tour }
} = useRoute("draws")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

const updating = ref(false)
const selectedType = ref<MatchType>("Singles")
const selectedDraw = ref<DrawType>("Main")

defineShortcuts({
  meta_shift_u: () => updateTiebreaks()
})

const { data: links } = await useFetch<any>("/api/events/draws/links", {
  query: { edId, tour }
})

watchImmediate(links, () => {
  if (!links.value.s_draw) {
    set(selectedType, "Doubles")
  }
})

watchImmediate([selectedType, selectedDraw], () => {
  if (selectedDraw.value === "Qualifying") {
    if (selectedType.value === "Singles" && !links.value?.qs_draw) {
      set(selectedDraw, "Main")
    } else if (selectedType.value === "Doubles" && !links.value?.qd_draw) {
      set(selectedDraw, "Main")
    }
  } else {
    if (selectedType.value === "Singles" && !links.value?.s_draw) {
      set(selectedType, "Doubles")
    } else if (!links.value?.d_draw) {
      set(selectedType, "Singles")
    }
  }
})

const updateTiebreaks = async () => {
  set(updating, true)
  try {
    const response = await $fetch("/api/matches/tiebreaks", {
      query: { id: edId }
    })
    if ((response as any).ok) {
      toast.add({
        title: "Tiebreaks updated successfully",
        icon: icons.check,
        color: "success"
      })
    } else {
      toast.add({
        title: "Error updating tiebreaks",
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: "Error updating tiebreaks",
      description: (e as Error).message,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(updating, false)
  }
}
</script>

<template>
  <div class="w-full">
    <events-wrapper-cards v-if="viewMode === 'cards'">
      <template #page-left>
        <dev-only>
          <matches-update />
          <u-button
            @click="updateTiebreaks"
            :icon="updating ? ICONS.uploading : icons.upload"
            label="Update tiebreaks"
            block
          />
        </dev-only>
        <u-radio-group
          v-if="links?.s_draw && links?.d_draw"
          legend="S/D"
          v-model="selectedType"
          :items="['Singles', 'Doubles']"
          :ui="{ item: 'ml-3' }"
        />
        <u-radio-group
          v-if="(links?.s_draw && links?.qs_draw) || (links?.d_draw && links?.qd_draw)"
          legend="Draw"
          v-model="selectedDraw"
          :items="['Main', 'Qualifying']"
          :ui="{ item: 'ml-3' }"
        />
      </template>

      <events-draws-country
        v-if="!links?.s_draw && !links?.d_draw"
        v-model:type="selectedType"
        v-model:draw="selectedDraw"
      />

      <events-draws-rr
        v-else-if="
          (selectedType === 'Singles' && selectedDraw === 'Main' && links.value?.s_draw === 'Round robin') ||
          (selectedType === 'Doubles' && selectedDraw === 'Main' && links.value?.d_draw === 'Round robin') ||
          (selectedType === 'Singles' && selectedDraw === 'Qualifying' && links.value?.qs_draw === 'Round robin') ||
          (selectedType === 'Doubles' && selectedDraw === 'Qualifying' && links.value?.qd_draw === 'Round robin')
        "
        v-model:type="selectedType"
        v-model:draw="selectedDraw"
      />

      <events-draws
        v-else
        v-model:type="selectedType"
        v-model:draw="selectedDraw"
      />
    </events-wrapper-cards>

    <events-wrapper-table v-else>
      <template #toolbar>
        <dev-only>
          <matches-update />
          <u-button
            @click="updateTiebreaks"
            :icon="updating ? ICONS.uploading : icons.upload"
            label="Update tiebreaks"
            block
          />
        </dev-only>
        <u-radio-group
          v-if="links?.s_draw && links?.d_draw"
          v-model="selectedType"
          :items="['Singles', 'Doubles']"
          class="w-full"
          orientation="horizontal"
        />
        <u-radio-group
          v-if="(links?.s_draw && links?.qs_draw) || (links?.d_draw && links?.qd_draw)"
          v-model="selectedDraw"
          :items="['Main', 'Qualifying']"
          class="w-full"
          orientation="horizontal"
        />
      </template>

      <events-draws-country
        v-if="!links?.s_draw && !links?.d_draw"
        v-model:type="selectedType"
        v-model:draw="selectedDraw"
      />

      <events-draws-rr
        v-else-if="
          (selectedType === 'Singles' && selectedDraw === 'Main' && links.value?.s_draw === 'Round robin') ||
          (selectedType === 'Doubles' && selectedDraw === 'Main' && links.value?.d_draw === 'Round robin') ||
          (selectedType === 'Singles' && selectedDraw === 'Qualifying' && links.value?.qs_draw === 'Round robin') ||
          (selectedType === 'Doubles' && selectedDraw === 'Qualifying' && links.value?.qd_draw === 'Round robin')
        "
        v-model:type="selectedType"
        v-model:draw="selectedDraw"
      />

      <events-draws
        v-else
        v-model:type="selectedType"
        v-model:draw="selectedDraw"
      />
    </events-wrapper-table>
  </div>
</template>
