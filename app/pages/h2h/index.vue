<script setup lang="ts">
useHead({ title: "Head to Head" })
const toast = useToast()

const { data } = await useFetch("/api/h2h", {
  default: () => []
})

const getMatchingOpponent = (item: H2HBaseType, index: number) => {
  return item.h2h.find(h => h.opponent.current_singles === index)
}

const getPlayer = (index: number) => {
  return data.value.find(h => h.player.current_singles === index)?.player
}

const player1Id = ref()
const player2Id = ref()

const navigateToH2H = async () => {
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
        </u-page-aside>
      </template>

      <u-page-header title="Head to Head" />

      <u-page-body>
        <table
          v-if="data.length"
          class="**:px-2 mx-auto"
        >
          <thead>
            <tr>
              <td></td>
              <td
                v-for="item in data"
                :key="item.player.id"
                class="[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180 whitespace-nowrap text-muted align-middle"
              >
                {{ item.player.first_name }} {{ item.player.last_name }}
              </td>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in data"
              :key="item.player.id"
              class="hover:bg-elevated"
            >
              <td class="whitespace-nowrap">
                <players-link :player="item.player" />
              </td>
              <td
                v-for="i in Array.from({ length: 10 }).map((_, i) => i + 1)"
                :key="i"
                class="text-center"
              >
                <template v-if="i === item.player.current_singles">—</template>
                <template v-else-if="getMatchingOpponent(item, i)">
                  <u-tooltip
                    :text="`${item.player.first_name} ${item.player.last_name} v ${getMatchingOpponent(item, i)?.opponent.first_name} ${
                      getMatchingOpponent(item, i)?.opponent.last_name
                    }`"
                  >
                    <u-link
                      :to="{ name: 'head-to-head', params: { p1Id: item.player.id, p2Id: getMatchingOpponent(item, i)!.opponent.id, p1Name: kebabCase(`${item.player.first_name} ${item.player.last_name}`), p2Name: kebabCase(`${getMatchingOpponent(item, i)?.opponent.first_name} ${getMatchingOpponent(item, i)?.opponent.last_name}`) } }"
                      class="default-link hover-link"
                    >
                      {{ getMatchingOpponent(item, i)?.wins || 0 }}-{{
                        (getMatchingOpponent(item, i)?.matches || 0) - (getMatchingOpponent(item, i)?.wins || 0)
                      }}
                    </u-link>
                  </u-tooltip>
                </template>
                <template v-else>
                  <u-tooltip :text="`${item.player.first_name} ${item.player.last_name} v ${getPlayer(i)!.first_name} ${getPlayer(i)!.last_name}`">
                    <u-link
                      :to="{ name: 'head-to-head', params: { p1Id: item.player.id, p2Id: getPlayer(i)!.id, p1Name: kebabCase(`${item.player.first_name} ${item.player.last_name}`), p2Name:  kebabCase(`${getPlayer(i)?.first_name} ${getPlayer(i)?.last_name}`) } }"
                      class="default-link hover-link"
                    >
                      0-0
                    </u-link>
                  </u-tooltip>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
