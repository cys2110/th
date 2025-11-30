<script setup lang="ts">
definePageMeta({ name: "draws" })

const {
  params: { edId, tour }
} = useRoute("draws")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

const updating = ref(false)
const selectedType = ref<MatchTypeEnumType>("Singles")
const selectedDraw = ref<DrawEnumType>("Main")
const drawType = ref<string>()
const drawLink = ref<string>()

const { data: links } = await useFetch("/api/events/draws/links", {
  query: { edId, tour }
})

watchImmediate([selectedType, selectedDraw, links], () => {
  // If overall edition has a draw type, use to display draw
  if (links.value?.draw_type) {
    set(drawType, links.value.draw_type)
    set(drawLink, links.value.draw_link)
  } else if (selectedDraw.value === "Main") {
    if (selectedType.value === "Singles") {
      // Check that tournament has singles main draw
      if (!links.value?.s_draw) {
        set(selectedType, "Doubles")
      } else {
        set(drawLink, links.value.s_draw)

        if (links.value.s_draw === "Round robin") {
          set(drawType, "Round robin")
        } else {
          set(drawType, "Elimination")
        }
      }
    } else {
      if (!links.value?.d_draw) {
        set(selectedType, "Singles")
      } else {
        set(drawLink, links.value.d_draw)

        if (links.value.d_draw === "Round robin") {
          set(drawType, "Round robin")
        } else {
          set(drawType, "Elimination")
        }
      }
    }
  } else {
    if (selectedType.value === "Singles") {
      // Check that tournament has qualifying singles main draw
      if (!links.value?.qs_draw) {
        set(selectedDraw, "Main")
      } else {
        set(drawLink, links.value.qs_draw)

        if (links.value.qs_draw === "Round robin") {
          set(drawType, "Round robin")
        } else {
          set(drawType, "Elimination")
        }
      }
    } else {
      if (!links.value?.qd_draw) {
        set(selectedDraw, "Main")
      } else {
        set(drawLink, links.value.qd_draw)

        if (links.value.qd_draw === "Round robin") {
          set(drawType, "Round robin")
        } else {
          set(drawType, "Elimination")
        }
      }
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
  <events-wrapper>
    <template #page-left>
      <dev-only>
        <u-button
          @click="updateTiebreaks"
          :icon="updating ? ICONS.uploading : icons.upload"
          label="Update tiebreaks"
          block
        />

        <matches-update />
      </dev-only>

      <u-radio-group
        v-if="links?.s_draw && links?.d_draw"
        v-model="selectedType"
        legend="S/D"
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

    <events-draws-country v-if="drawType === 'Country draw'" />

    <events-draws-rr v-else-if="drawType === 'Round robin'" />

    <events-draws
      v-else
      v-model:type="selectedType"
      v-model:draw="selectedDraw"
    />
  </events-wrapper>
</template>
