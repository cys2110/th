<script setup lang="ts">
import type { BreadcrumbItem, PageFeatureProps, TabsItem } from "@nuxt/ui"
import { kebabCase, startCase } from "lodash"
import { type QueryData } from "@supabase/supabase-js"
import { ICONS, POSITION_GROUP_MAPPING } from "#imports"

definePageMeta({ name: "player" })

const route = useRoute("player")
const supabase = useSupabaseClient()
const toast = useToast()
const { ui } = useAppConfig()

const playerQuery = () => supabase.from("player_details").select("*, country!nationality_country_id(name)").eq("id", route.params.id).single()

type PlayerType = QueryData<ReturnType<typeof playerQuery>>

const { data: player, refresh } = await useAsyncData(
  () => `player-${route.params.id}`,
  async () => {
    const { data, error } = await playerQuery()

    if (error || !data) {
      console.error("Error fetching player:", error)
      return null
    }

    return data
  }
)

useHead({
  title: () => player.value?.label || startCase(route.params.name as string),
  templateParams: { category: "Players" }
})

const breadcrumbs: Array<BreadcrumbItem> = [{ label: "Players", to: { name: "players" } }]

const playerDetails = computed(() => {
  if (player.value) {
    const {
      aka,
      full_name,
      height_cm,
      preferred_foot,
      team_name,
      team_id,
      team_logo,
      position,
      birth_place,
      birth_country_icon,
      birth_country,
      country,
      icon,
      dob,
      dod
    } = player.value

    const fields: Array<PageFeatureProps & { src?: string | null }> = []

    if (aka) fields.push({ description: "Full Name", title: full_name! })

    if (dob || dod) {
      if (dob) {
        fields.push({
          title: getAge(new Date(dob), dod ? new Date(dod) : new Date()),
          description: formatDate(dob, dod)
        })
      } else if (dod) {
        fields.push({ title: formatDate(dod), description: "Died" })
      }
    }

    if (country && icon) fields.push({ title: country.name, description: "Nationality", icon })

    if (birth_country_icon && birth_country)
      fields.push({ title: birth_place || birth_country, description: "Birth Place", icon: birth_country_icon })

    if (height_cm) fields.push({ title: `${height_cm} cm`, description: "Height" })

    if (preferred_foot) fields.push({ title: startCase(preferred_foot), description: "Preferred Foot" })

    if (team_name && team_id)
      fields.push({
        title: team_name,
        description: "Current Team",
        to: { name: "team", params: { id: team_id, name: kebabCase(team_name) } },
        src: team_logo
      })

    if (position) fields.push({ title: POSITION_GROUP_MAPPING[position], description: "Current Position" })

    return fields
  }

  return null
})

const editableFields: Array<{ label: string; key: keyof PlayerType; type: string }> = [
  { label: "First Name", key: "first_name", type: "text" },
  { label: "Last Name", key: "last_name", type: "text" },
  { label: "Alias", key: "aka", type: "text" },
  { label: "Date of Birth", key: "dob", type: "date" },
  { label: "Date of Death", key: "dod", type: "date" },
  { label: "Nationality", key: "nationality_country_id", type: "country" },
  { label: "Birth Place", key: "birth_place", type: "text" },
  { label: "Country of Birth", key: "birth_country_id", type: "country" },
  { label: "Height", key: "height_cm", type: "number" },
  { label: "Preferred Foot", key: "preferred_foot", type: "radio" }
]

const editedFields = ref<Partial<Record<keyof PlayerType, any>>>({})

const handleSave = async () => {
  const personEditedFields = {}

  const playerEditedFields = {}

  const playerFields = ["aka", "height_cm", "preferred_foot"] as const

  for (const [key, value] of Object.entries(editedFields.value)) {
    if (playerFields.includes(key as any)) {
      // @ts-expect-error
      playerEditedFields[key] = value
    } else {
      // @ts-expect-error
      personEditedFields[key] = value
    }
  }

  let updateError = []

  if (Object.keys(playerEditedFields).length) {
    const { error } = await supabase.from("player").update(playerEditedFields).eq("id", route.params.id)

    if (error) updateError.push(error)
  }

  if (Object.keys(personEditedFields).length) {
    const { error } = await supabase.from("people").update(personEditedFields).eq("id", player.value!.person_id!)

    if (error) updateError.push(error)
  }

  if (updateError.length) {
    toast.add({
      title: "Error updating player",
      color: "error",
      icon: ui.icons.error
    })
    console.error("Error updating player", updateError)
  } else {
    toast.add({
      title: "Player successfully updated",
      color: "success",
      icon: ui.icons.success
    })
    refresh()
    editedFields.value = {}
  }
}

const statsItems: Array<TabsItem> = [
  { label: "Match", slot: "match" },
  { label: "Season", slot: "season" },
  { label: "Career", slot: "career" }
]
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header :title="player?.label || startCase(route.params.name as string)">
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>
      </u-page-header>

      <u-page-body>
        <div
          v-if="playerDetails"
          class="flex flex-wrap gap-3 justify-evenly"
        >
          <u-page-feature
            v-for="detail in playerDetails"
            :key="detail.title"
            v-bind="detail"
          >
            <template
              #leading
              v-if="detail.src"
            >
              <u-avatar
                :src="detail.src || ''"
                loading="lazy"
                :icon="ICONS.team"
              />
            </template>
          </u-page-feature>
        </div>

        <empty
          v-else
          :title="`No information available about ${startCase(route.params.name as string)}`"
          icon="line-md:person-off-twotone"
          @refresh="refresh"
        />

        <dev-only v-if="player">
          <div class="flex justify-end">
            <u-button
              :icon="ICONS.save"
              :disabled="Object.keys(editedFields).length === 0"
              @click="handleSave"
            />
          </div>

          <div class="flex justify-evenly gap-3">
            <u-form-field
              v-for="field in editableFields"
              :key="field.label"
              :label="field.label"
            >
              <template #hint>
                <u-checkbox
                  :model-value="field.key in editedFields"
                  @update:model-value="
                    () => {
                      if (field.key in editedFields) {
                        delete editedFields[field.key]
                      } else {
                        editedFields[field.key] = player![field.key] || null
                      }
                    }
                  "
                />
              </template>

              <template
                #default
                v-if="field.key in editedFields"
              >
                <u-radio-group
                  v-if="field.type === 'radio'"
                  v-model="editedFields[field.key]"
                  :items="['right', 'left']"
                />

                <u-field-group v-else-if="field.type === 'number'">
                  <form-input-number
                    placeholder="Height (cm)"
                    v-model="editedFields[field.key]"
                  />

                  <u-badge
                    label="cm"
                    color="neutral"
                    variant="outline"
                  />
                </u-field-group>

                <form-input
                  v-else-if="field.type === 'text'"
                  :placeholder="field.label"
                  v-model="editedFields[field.key]"
                  class="w-fit"
                />

                <country-search
                  v-else-if="field.type === 'country'"
                  v-model="editedFields[field.key]"
                  class="w-fit"
                />

                <form-date-picker
                  v-else-if="field.type === 'date'"
                  v-model="editedFields[field.key]"
                  class="w-fit"
                />
              </template>
            </u-form-field>
          </div>
        </dev-only>

        <dashboard-subpanel title="Teams">
          <player-teams />
        </dashboard-subpanel>

        <dashboard-subpanel title="Stats">
          <u-tabs
            :items="statsItems"
            size="xs"
          >
            <template #match>
              <player-match-stats />
            </template>

            <template #season>
              <player-season-stats />
            </template>

            <template #career>
              <player-career-stats />
            </template>
          </u-tabs>
        </dashboard-subpanel>
      </u-page-body>
    </u-page>
  </u-container>
</template>
