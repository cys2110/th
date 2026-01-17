<script setup lang="ts">
import type { BreadcrumbItem, DropdownMenuItem, PageLink } from "@nuxt/ui"

definePageMeta({ name: "match" })

const {
  ui: { icons }
} = useAppConfig()
const {
  params: { id, edId, year, name }
} = useRoute("match")

const tour = useRouteQuery("tour")
const draw = useRouteQuery("draw")
const type = useRouteQuery("type")
const matchNo = useRouteQuery("match_no")
const matchStore = useMatchStore()

const categories: Record<string, string> = {
  "Service Stats": "text-Active",
  "Return Stats": "text-Inactive",
  "Points Stats": "text-ITF",
  "Service Speed": "text-Challenger"
}

// API call
const { data: match, status } = await useFetch("/api/match", {
  query: { edId, tour, draw, type, matchNo }
})

watch(
  match,
  () => {
    if (match.value) {
      matchStore.name = match.value.tournament
      matchStore.team1Name = match.value.t1?.team.map(p => `${p.first_name} ${p.last_name}`).join(" / ") || ""
      console.log(matchStore.team1Name)
      matchStore.team2Name = match.value.t2?.team.map(p => `${p.first_name} ${p.last_name}`).join(" / ") || ""
    } else {
      matchStore.name = startCase(name)
    }
  },
  { immediate: true }
)

const matchStats = computed(() => {
  if (match.value) {
    return transformMatchStats(match.value)
  }
  return undefined
})

useHead({
  title: () => (matchStore.team1Name && matchStore.team2Name ? `${matchStore.team1Name} v ${matchStore.team2Name}` : (matchNo.value as string)),
  templateParams: {
    category: `${matchStore.name} ${year}`
  }
})

const additionalLinks = computed<PageLink[]>(() => {
  if (match.value) {
    const { t1, t2 } = match.value
    const t1Links = t1?.team.map(p => ({
      label: `${p.first_name} ${p.last_name}`,
      icon: ICONS.player,
      to: { name: "player", params: { id: p.id, name: kebabCase(`${p.first_name} ${p.last_name}`) } }
    }))
    const t2Links = t2?.team.map(p => ({
      label: `${p.first_name} ${p.last_name}`,
      icon: ICONS.player,
      to: { name: "player", params: { id: p.id, name: kebabCase(`${p.first_name} ${p.last_name}`) } }
    }))
    const h2hLink = [
      {
        label: "H2H",
        icon: ICONS.h2h,
        to: {
          name: "head-to-head",
          params: {
            p1Name: t1?.team.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join("+"),
            p2Name: t2?.team.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join("+"),
            p1Id: t1?.team.map(player => player.id).join("+"),
            p2Id: t2?.team.map(player => player.id).join("+")
          }
        }
      }
    ]
    return [...t1Links!, ...t2Links!, ...h2hLink] as PageLink[]
  }

  return []
})

const breadcrumbs = computed<BreadcrumbItem[]>(
  () =>
    [
      { icon: ICONS.trophy, to: { name: "tournaments" }, label: "Tournaments" },
      { label: matchStore.name, to: { name: "tournament", params: { id, name } } },
      { label: year as string, to: { name: "edition", params: { id, name, year, edId } } },
      { label: type },
      { label: draw },
      ...(match.value ? [{ label: match.value.round }] : [])
    ] as BreadcrumbItem[]
)
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <template v-if="match">
              <match-country-update v-if="COUNTRY_DRAWS.includes(id)" />
              <match-update v-else />
            </template>

            <u-separator />
          </dev-only>

          <u-page-links :links="additionalLinks" />

          <u-separator />

          <div
            v-for="(className, category) in categories"
            :key="category"
            class="flex items-center gap-2 text-muted"
          >
            <u-icon
              :name="ICONS.colour"
              :class="className"
            />
            <span>{{ category }}</span>
          </div>
        </u-page-aside>
      </template>

      <u-page-header>
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template #title>
          <div v-if="matchStore.team1Name && matchStore.team2Name">
            {{ matchStore.team1Name }} v
            {{ matchStore.team2Name }}
          </div>

          <div v-else> {{ matchStore.name }} {{ year }} {{ tour }} {{ matchNo }} </div>
        </template>

        <template #links>
          <u-dropdown-menu
            class="lg:hidden"
            :items="(additionalLinks as DropdownMenuItem[])"
          >
            <u-button :icon="icons.info" />
          </u-dropdown-menu>
        </template>
      </u-page-header>

      <u-page-body>
        <empty
          v-if="!tour || !type || !draw || !matchNo || !match"
          message="No match details available"
        />

        <match-details
          v-else
          :match
        />

        <match-table
          :match="matchStats"
          :status
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
