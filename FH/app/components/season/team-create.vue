<script setup lang="ts">
import { ICONS } from "#imports"
import { set } from "@vueuse/core"
import { type Tables } from "~/types/database.types"

type Group = Tables<{ schema: "football" }, "group">

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const props = defineProps<{ seasonId: string }>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("season")
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const seasonName = computed(() => decodeURIComponent(route.params.season as string))
const { teams: teamResults, pending, fetchTeams, searchTerm } = useTeamSearch()

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const teams = ref<Array<string>>([])
const groups = ref<Array<Group>>([])
const groupLoading = ref(false)

const insertStandings = ref(false)
const groupId = ref<string>()

const handleReset = () => {
  set(teams, [])
  set(groupId, undefined)
  set(errors, undefined)
}

const fetchGroups = async () => {
  set(groupLoading, true)

  const { data, error } = await supabase.from("group").select("*").eq("season_id", props.seasonId)

  if (error) {
    console.error("Error fetching groups:", error)
  } else {
    set(groups, data)
  }

  set(groupLoading, false)
}

const onSubmit = async () => {
  set(isSaving, true)

  const { error } = await supabase.from("team_season").insert(teams.value.map(team => ({ team_id: team, season_id: props.seasonId })))

  toast.add({
    title: error ? `Error adding teams` : `Teams successfully added!`,
    icon: ui.icons[error ? "error" : "success"],
    color: error ? "error" : "success"
  })

  if (error) {
    console.error("Error creating team:", error)
    set(errors, error)
  } else {
    if (insertStandings.value) {
      const { error: standingsError } = await supabase.from("standing").insert(
        teams.value.map(team => ({
          season_id: props.seasonId,
          team_id: team,
          group_id: groupId.value
        }))
      )

      if (standingsError) {
        console.error("Error creating standings:", standingsError)
        set(errors, standingsError)
        return
      }

      if (groupId.value) {
        const { error: groupError } = await supabase.from("group_team").insert(teams.value.map(team => ({ group_id: groupId.value!, team_id: team })))

        if (groupError) {
          console.error("Error creating group team:", groupError)
          set(errors, groupError)
          return
        }
      }
    }

    handleReset()
    emits("refresh")
    set(isOpen, false)
  }

  set(isSaving, false)
}

watch(insertStandings, () => {
  if (insertStandings.value) {
    fetchGroups()
  }
})
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    :title="`Add Teams to ${seasonName}`"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <div class="space-y-3">
        <u-alert
          v-if="errors"
          color="error"
          title="Error adding teams"
          :description="errors"
        />

        <div class="grid grid-cols-2 gap-3 items-center">
          <u-switch
            v-model="insertStandings"
            label="Standings"
          />

          <u-input-menu
            v-if="insertStandings"
            v-model="groupId"
            :items="groups"
            label-key="name"
            value-key="id"
            placeholder="Group"
            :loading="groupLoading"
            class="w-full"
          />
        </div>

        <u-listbox
          v-model="teams"
          v-model:search-term="searchTerm"
          :items="<any>teamResults"
          multiple
          value-key="id"
          label-key="name"
          filter
          ignore-filter
          :loading="pending"
        >
          <template #item-leading="{ item }">
            <u-avatar
              :src="item.logo_url || ''"
              loading="lazy"
              :icon="ICONS.team"
            />
          </template>

          <template #item-description="{ item }">
            {{ item.nicknames[0] }}
          </template>
        </u-listbox>
      </div>
    </template>

    <template #footer="{ close }">
      <u-button
        label="Submit"
        color="success"
        block
        :icon="ICONS.save"
        :loading="isSaving"
        :loading-icon="ICONS.uploading"
        @click="onSubmit"
      />

      <u-button
        label="Reset"
        color="warning"
        block
        :icon="ui.icons.reload"
        @click="handleReset"
      />

      <u-button
        label="Cancel"
        color="error"
        block
        :icon="ui.icons.close"
        @click="close"
      />
    </template>
  </u-modal>
</template>
