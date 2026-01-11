<script setup lang="ts">
import { keyBy } from "lodash"

definePageMeta({ name: "draws" })

const {
  params: { edId }
} = useRoute("draws")

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

const updating = ref(false)
const isUpdating = ref(false)
const selectedTour = useRouteQuery<keyof typeof tourEnum>("tour", "ATP")
const selectedType = useRouteQuery<MatchTypeEnumType>("type", "Singles")
const selectedDraw = useRouteQuery<DrawEnumType>("draw", "Main")
const drawType = ref<string>()
const drawLink = ref<string>()
const links = ref<any>({})
const showTour = ref(true)
const showDraw = ref(true)
const showType = ref(true)

// const { data } = await useFetch("/api/editions/draws/links", {
//   query: { edId },
//   onResponse: ({ response }) => {
//     if (response._data?.draw_type) {
//       set(drawType, response._data?.draw_type)
//       set(drawLink, response._data?.draw_link)
//       set(showTour, false)
//       set(showDraw, false)

//       if (response._data?.draw_type === "Laver Cup") set(showType, false)
//     } else if (response._data?.events?.length) {
//       if (response._data.events.length === 1) set(showTour, false)

//       if (response._data.events.every((e: any) => !e.qs_draw && !e.qd_draw)) {
//         set(showDraw, false)
//       }

//       if (response._data.events.every((e: any) => !e.s_draw) || response._data.events.every((e: any) => !e.d_draw)) {
//         set(showType, false)
//       }

//       set(selectedTour, response._data.events[0]!.tour)
//       const groupedLinks = []

//       for (const event of response._data.events) {
//         groupedLinks.push({
//           tour: event.tour,
//           Singles: {
//             Main: event.s_draw
//               ? {
//                   draw: event.s_draw === "Round robin" ? "Round robin" : "Elimination",
//                   link: event.s_link
//                 }
//               : undefined,
//             Qualifying: event.qs_draw
//               ? {
//                   draw: event.qs_draw === "Round robin" ? "Round robin" : "Elimination",
//                   link: event.qs_link
//                 }
//               : undefined
//           },
//           Doubles: {
//             Main: event.d_draw
//               ? {
//                   draw: event.d_draw === "Round robin" ? "Round robin" : "Elimination",
//                   link: event.d_link
//                 }
//               : undefined,
//             Qualifying: event.qd_draw
//               ? {
//                   draw: event.qd_draw === "Round robin" ? "Round robin" : "Elimination",
//                   link: event.qd_link
//                 }
//               : undefined
//           }
//         })
//       }

//       set(links, keyBy(groupedLinks, "tour"))
//     }
//   }
// })

// watchImmediate([selectedTour, selectedType, selectedDraw], () => {
//   if (isUpdating.value) return

//   const tour = selectedTour.value
//   const type = selectedType.value
//   const draw = selectedDraw.value
//   const combo = links.value[tour]?.[type]?.[draw]

//   if (!combo) {
//     isUpdating.value = true

//     if (draw === "Main") {
//       set(selectedType, type === "Singles" ? "Doubles" : "Singles")
//     } else {
//       set(selectedDraw, "Main")
//     }

//     nextTick(() => (isUpdating.value = false))
//     return
//   }

//   isUpdating.value = true
//   set(drawType, combo.draw)
//   set(drawLink, combo.link)
//   nextTick(() => (isUpdating.value = false))
// })

// const updateTiebreaks = async () => {
//   set(updating, true)
//   try {
//     const response = await $fetch("/api/matches/tiebreaks", {
//       query: { id: edId }
//     })
//     if ((response as any).ok) {
//       toast.add({
//         title: "Tiebreaks updated successfully",
//         icon: icons.check,
//         color: "success"
//       })
//     } else {
//       toast.add({
//         title: "Error updating tiebreaks",
//         description: (response as any).message,
//         icon: icons.error,
//         color: "error"
//       })
//     }
//   } catch (e) {
//     toast.add({
//       title: "Error updating tiebreaks",
//       description: (e as Error).message,
//       icon: icons.error,
//       color: "error"
//     })
//   } finally {
//     set(updating, false)
//   }
// }
</script>

<template>
  <u-container>
    <!-- <u-page>
      <template #left>
        <u-page-aside>
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
            v-if="showTour"
            v-model="selectedTour"
            legend="Tour"
            :items="Object.keys(links)"
            :ui="{ item: 'ml-3' }"
          />
          <u-radio-group
            v-if="showType"
            v-model="selectedType"
            legend="S/D"
            :items="['Singles', 'Doubles']"
            :ui="{ item: 'ml-3' }"
          />
          <u-radio-group
            v-if="showDraw"
            legend="Draw"
            v-model="selectedDraw"
            :items="['Main', 'Qualifying']"
            :ui="{ item: 'ml-3' }"
          />
        </u-page-aside>
      </template>
      <editions-wrapper>
        <template #header-links>
          <u-button
            v-if="drawLink"
            :to="drawLink"
            :icon="ICONS.pdf"
            target="_blank"
          />
        </template>
      </editions-wrapper>
      <u-page-body>
        <editions-draws-country v-if="drawType === 'Country draw'" />
        <editions-draws-rr v-else-if="drawType === 'Round robin'" />
        <editions-draws
          v-else-if="drawType === 'Elimination'"
          v-model:tour="selectedTour"
          v-model:type="selectedType"
          v-model:draw="selectedDraw"
        />
        <empty
          v-else
          message="No draw available"
        />
      </u-page-body>
    </u-page> -->
  </u-container>
</template>
