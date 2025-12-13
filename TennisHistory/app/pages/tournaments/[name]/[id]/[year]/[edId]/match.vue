<script setup lang="ts">
import type { DropdownMenuItem, PageLink } from "@nuxt/ui"

definePageMeta({ name: "match" })

const {
  ui: { icons }
} = useAppConfig()
const {
  params: { edId, year, name }
} = useRoute("match")

const tour = useRouteQuery("tour")
const draw = useRouteQuery("draw")
const type = useRouteQuery("type")
const matchNo = useRouteQuery("match_no")

const categories: Record<string, string> = {
  "Service Stats": "text-Active",
  "Return Stats": "text-Inactive",
  "Points Stats": "text-ITF",
  "Service Speed": "text-Challenger"
}

// API call
const { data: match, status } = await useFetch("/api/matches", {
  query: { edId, tour, draw, type, matchNo }
})

const matchStats = computed(() => {
  if (match.value) {
    return transformMatchStats(match.value)
  }
  return undefined
})

useHead({
  title: () => {
    if (match.value) {
      const { t1, t2, tournament } = match.value
      const t1Name = t1?.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ")
      const t2Name = t2?.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ")

      return `${t1Name} v ${t2Name} | ${tournament} ${year} ${tour}`
    }

    return `${capitalCase(name as string)} ${year} ${tour} ${matchNo}`
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
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <matches-update
              v-if="match"
              :match
            />

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
              :name="ICONS.colours"
              :class="className"
            />
            <span>{{ category }}</span>
          </div>
        </u-page-aside>
      </template>

      <u-page-header>
        <template #headline>
          <breadcrumbs />
        </template>

        <template #title>
          <div v-if="match">
            {{ match.t1?.team.map(p => `${p.first_name} ${p.last_name}`).join(" / ") }} v
            {{ match.t2?.team.map(p => `${p.first_name} ${p.last_name}`).join(" / ") }}
          </div>

          <div v-else> {{ capitalCase(name) }} {{ year }} {{ tour }} {{ matchNo }} </div>
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

        <matches-details
          v-else
          :match
        />

        <matches-table
          :match="matchStats"
          :status
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
