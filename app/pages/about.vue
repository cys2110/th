<script setup lang="ts">
useHead({ title: "About" })

const {
  ui: { icons, colors }
} = useAppConfig()

const badges: [keyof typeof colors, string][] = [
  ["ATP", "ATP"],
  ["WTA", "WTA"],
  ["Men", "ITF (M)"],
  ["Women", "ITF (W)"],
  ["Active", "Active"],
  ["Inactive", "Inactive"],
  ["Singles", "Singles"],
  ["Doubles", "Doubles"],
  ["Tour", "Tour level"],
  ["Challenger", "Challenger level"],
  ["ITF", "ITF level"],
  ["Main", "Main draw"],
  ["Qualifying", "Qualifying draw"]
]
</script>

<template>
  <u-container class="max-w-6xl">
    <u-page>
      <u-page-header title="About">
        <template #description>
          DISCLAIMER: This website is not intended to infringe on any copyright. It is not intended for any monetary or any other disallowed purpose.
        </template>
      </u-page-header>

      <u-page-body>
        <div>
          This website displays data about Open Era men's and women's tennis in a user-friendly format. The goal is to include data going back to
          1968, but given the volume of the data, please be patient. New features will be introduced as often as possible. Suggestions are welcome!
        </div>
        <div>
          I have tried to gather data from the most reliable sources, including the official ATP and WTA websites. However, please note that some data
          (particularly relating to players' coaches as well as data relating to older events) may be inaccurate or incomplete - please let me know if
          you find any issues. Moreover, players' win-loss index and stats are based solely on their singles matches as, even where available, stats
          for doubles matches often do not break out the individual players' stats. All stats are drawn from matches where stats are available online.
        </div>
        <div class="flex items-center">
          You can toggle between light and dark mode by clicking the&nbsp;<u-icon :name="icons.search" />&nbsp;button in the sidebar.
        </div>
        <div>
          Different categories on the website are colour-coded as follows:
          <div class="flex flex-wrap items-center gap-5 my-5">
            <u-badge
              v-for="badge in badges"
              :key="badge[0]"
              :color="badge[0]"
              :label="badge[1]"
            />
          </div>
        </div>
      </u-page-body>
    </u-page>
  </u-container>
</template>
