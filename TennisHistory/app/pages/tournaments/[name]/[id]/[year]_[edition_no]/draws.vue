<script setup lang="ts">
definePageMeta({ name: "draws" })

const route = useRoute("draws")
const supabase = useSupabaseClient()
const { ui } = useAppConfig()
const toast = useToast()

const tournamentStore = useTournamentStore()

const editionId = computed(() => tournamentStore.ids.edition)

const { data: draws } = await useAsyncData(
  () => `draw-options-${editionId.value}`,
  async () => {
    if (editionId.value) {
      const { data, error } = await supabase
        .schema("tennis")
        .from("events")
        .select("*")
        .eq("edition_id", editionId.value)
        .order("tour", { ascending: true })

      if (error || !data) {
        console.error("Error fetching edition", error)
        return [] as DrawOption[]
      }

      return data.flatMap(event => {
        const eventDraws: DrawOption[] = []
        const drawOptions: Array<{
          key: keyof typeof event
          label: string
          link_key: keyof typeof event
          match_type: MatchTypeEnum
          draw: DrawEnum
        }> = [
          { key: "s_draw", label: "Singles", link_key: "s_link", match_type: "Singles", draw: "Main" },
          { key: "d_draw", label: "Doubles", link_key: "d_link", match_type: "Doubles", draw: "Main" },
          { key: "qs_draw", label: "Qualifying Singles", link_key: "qs_link", match_type: "Singles", draw: "Qualifying" },
          { key: "qd_draw", label: "Qualifying Doubles", link_key: "qd_link", match_type: "Doubles", draw: "Qualifying" }
        ]

        for (const option of drawOptions) {
          if (event[option.key]) {
            eventDraws.push({
              label: `${tournamentStore.tours.length > 1 ? `${event.tour} ` : ""}${option.label}`,
              link: event[option.link_key] as string | null,
              draw_type: event[option.key] as DrawTypeEnum,
              tour: event.tour as TourEnum,
              match_type: option.match_type,
              draw: option.draw
            })
          }
        }

        return eventDraws
      })
    }

    return [] as DrawOption[]
  },
  {
    // The child edition-wrapper populates the store during server rendering.
    // Fetch on the client, where edition ID changes can trigger this request.
    server: false,
    default: () => [] as DrawOption[]
  }
)
</script>

<template>
  <u-container>
    <u-page>
      <edition-wrapper />

      <u-page-body>
        <u-tabs
          :items="draws"
          size="xs"
        >
          <template #content="{ item }">
            <edition-draws
              v-if="item.draw_type === 'Elimination'"
              :item
            />
          </template>
        </u-tabs>
      </u-page-body>
    </u-page>
  </u-container>
</template>
