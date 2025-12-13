<script setup lang="ts">
useHead({ title: "Head to Head" })
const toast = useToast()

// TODO: Add WTA players
const { data, status } = await useFetch("/api/h2h", {
  default: () => ({ players: [], results: [] })
})

const player1Id = ref()
const player2Id = ref()

const navigateToH2H = async () => {
  // TODO: Add guard to check tours are the same
  if (player1Id.value && player2Id.value) {
    await navigateTo({
      name: "head-to-head",
      params: {
        p1Id: player1Id.value.value,
        p2Id: player2Id.value.value,
        p1Name: kebabCase(player1Id.value.label),
        p2Name: kebabCase(player2Id.value.label)
      }
    })
  } else {
    toast.add({
      title: "Please select two players",
      color: "error"
    })
  }
}
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <client-only>
            <div class="flex items-center gap-2">
              <form-search
                type="Player"
                v-model="player1Id"
                placeholder="Player 1"
              />
              <span class="text-sm"> v </span>
              <form-search
                type="Player"
                v-model="player2Id"
                placeholder="Player 2"
              />
            </div>
            <u-button
              label="Go to Head to Head"
              block
              @click="navigateToH2H"
            />
          </client-only>
        </u-page-aside>
      </template>

      <u-page-header title="Head to Head" />

      <u-page-body>
        <client-only>
          <u-table
            :data="data.results"
            :columns="h2hColumns(data.players)"
            :loading="status === 'pending'"
            :ui="{ th: 'px-0', td: 'px-0.5' }"
          />
        </client-only>
      </u-page-body>
    </u-page>
  </u-container>
</template>
