<script setup lang="ts">
import { keyBy } from "lodash"

definePageMeta({ name: "draws" })

const {
  params: { id, edId }
} = useRoute("draws")

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const tournamentStore = useTournamentStore()

const updating = ref(false)
const isUpdating = ref(false)
const selectedTour = useRouteQuery<keyof typeof tourEnum>("tour", tournamentStore.tours[0])
const selectedType = useRouteQuery<MatchTypeEnumType>("type", "Singles")
const selectedDraw = useRouteQuery<DrawEnumType>("draw", "Main")
const drawType = ref<string>()
const drawLink = ref<string>()
const links = ref<any>({})
const showTour = ref(tournamentStore.tours.length > 1)
const showDraw = ref(true)
const showType = ref(true)

const { data } = await useFetch("/api/edition/draws/links", {
  query: { edId }
})

watch(
  data,
  () => {
    if (data.value?.draw_type) {
      set(showTour, false)
      set(showDraw, false)
      set(showType, false)
      set(drawType, data.value.draw_type)
      set(drawLink, data.value.draw_link)
    }

    const events = data.value?.events || []

    if (events.every((e: any) => !e.qs_draw && !e.qd_draw)) set(showDraw, false)

    if (events.every((e: any) => !e.s_draw) || events.every((e: any) => !e.d_draw)) set(showType, false)

    const groupedLinks = []

    for (const event of events) {
      groupedLinks.push({
        tour: event.tour,
        Singles: {
          Main: event.s_draw
            ? {
                draw: event.s_draw === "Round robin" ? "Round robin" : "Elimination",
                link: event.s_link
              }
            : undefined,
          Qualifying: event.qs_draw
            ? {
                draw: event.qs_draw === "Round robin" ? "Round robin" : "Elimination",
                link: event.qs_link
              }
            : undefined
        },
        Doubles: {
          Main: event.d_draw
            ? {
                draw: event.d_draw === "Round robin" ? "Round robin" : "Elimination",
                link: event.d_link
              }
            : undefined,
          Qualifying: event.qd_draw
            ? {
                draw: event.qd_draw === "Round robin" ? "Round robin" : "Elimination",
                link: event.qd_link
              }
            : undefined
        }
      })
    }

    set(links, keyBy(groupedLinks, "tour"))
  },
  { immediate: true }
)

watchImmediate([selectedTour, selectedType, selectedDraw], () => {
  if (isUpdating.value) return

  const tour = selectedTour.value
  const type = selectedType.value
  const draw = selectedDraw.value
  const combo = links.value[tour]?.[type]?.[draw]

  if (!combo) {
    isUpdating.value = true

    if (draw === "Main" && links.value[tour]?.[type]?.Qualifying) {
      set(selectedDraw, "Qualifying")
    } else if (links.value[tour]?.Singles.Main) {
      set(selectedType, "Singles")
      set(selectedDraw, "Main")
    } else {
      set(selectedType, "Doubles")
      set(selectedDraw, "Main")
    }

    nextTick(() => (isUpdating.value = false))
    return
  }

  isUpdating.value = true
  set(drawType, combo.draw)
  set(drawLink, combo.link)
  nextTick(() => (isUpdating.value = false))
})

const updateTiebreaks = async () => {
  set(updating, true)
  try {
    const response = await $fetch("/api/matches/tiebreaks", {
      query: { id: edId }
    })
    if (response.success) {
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
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <u-button
              @click="updateTiebreaks"
              :icon="updating ? ICONS.uploading : icons.upload"
              label="Update tiebreaks"
              block
              color="Doubles"
            />

            <match-country-update v-if="COUNTRY_DRAWS.includes(id)" />
            <match-update v-else />

            <u-separator />
          </dev-only>

          <u-radio-group
            v-if="showTour"
            v-model="selectedTour"
            legend="Tour"
            :items="Object.keys(links)"
          />

          <filters-match-type
            v-if="showType"
            v-model="selectedType"
          />

          <filters-draw-type
            v-if="showDraw"
            v-model="selectedDraw"
          />
        </u-page-aside>
      </template>
      <edition-wrapper>
        <template #header-links>
          <u-button
            v-if="drawLink"
            :to="drawLink"
            :icon="ICONS.pdf"
            target="_blank"
          />
        </template>
      </edition-wrapper>
      <u-page-body>
        <edition-draws
          v-if="drawType === 'Elimination' || drawType === 'Round robin'"
          v-model:tour="selectedTour"
          v-model:type="selectedType"
          v-model:draw="selectedDraw"
        />

        <edition-draws-rr
          v-if="drawType === 'Round robin'"
          v-model:tour="selectedTour"
          v-model:type="selectedType"
          v-model:draw="selectedDraw"
        />
        <!-- <editions-draws-country v-if="drawType === 'Country draw'" />
        <empty
          v-else
          message="No draw available"
        /> -->
      </u-page-body>
    </u-page>
  </u-container>
</template>
