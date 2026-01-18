<script setup lang="ts">
import type { PageFeatureProps } from "@nuxt/ui"

definePageMeta({ name: "home" })
useHead({ title: "Home" })

const features: PageFeatureProps[] = [
  {
    title: "Results",
    icon: ICONS.calendar,
    description: "Explore tournament results starting from the Open Era",
    to: { name: "results-archive" }
  },
  {
    title: "Head to Head",
    icon: ICONS.h2h,
    description: "Examine match ups between players",
    to: { name: "h2h" }
  },
  {
    title: "Statistics and Records",
    icon: ICONS.stats,
    description: "Charge up your tennis trivia with fun facts and figures",
    to: { name: "statistics-and-records" }
  }
]

// Screenshots
const darkModeScreenshots: string[] = ["country", "h2h"]
const lightModeScreenshots: string[] = []
</script>

<template>
  <u-container class="max-w-7xl">
    <u-page>
      <u-page-body>
        <u-page-section
          title="Tennis History in the Open Era"
          description="Explore tennis since 1968"
          icon="twemoji:tennis"
          orientation="vertical"
          :features
        >
          <div class="relative w-full h-100 overflow-hidden rounded-lg">
            <u-marquee
              orientation="vertical"
              :overlay="false"
              :ui="{
                root: 'hidden lg:flex [--duration:40s] absolute w-[460px] -left-[100px] -top-[300px] h-[940px] transform-3d rotate-x-55 rotate-y-0 rotate-z-30'
              }"
            >
              <nuxt-img
                v-for="screenshot in darkModeScreenshots"
                :key="screenshot"
                :src="`/pages/dark-${screenshot}.png`"
                width="460"
                height="258"
                class="aspect-video border border-default rounded-lg bg-white"
              />
            </u-marquee>
            <u-marquee
              reverse
              orientation="vertical"
              :overlay="false"
              :ui="{
                root: '[--duration:40s] absolute w-[460px] -top-[400px] left-[480px] h-[1160px] transform-3d rotate-x-55 rotate-y-0 rotate-z-30'
              }"
            >
              <nuxt-img
                v-for="screenshot in lightModeScreenshots"
                :key="screenshot"
                :src="`/pages/light-${screenshot}.png`"
                width="460"
                height="258"
                class="aspect-video border border-default rounded-lg bg-white"
              />
            </u-marquee>

            <u-marquee
              orientation="vertical"
              :overlay="false"
              :ui="{
                root: 'hidden md:flex [--duration:40s] absolute w-[460px] -top-[300px] left-[1020px] h-[1060px] transform-3d rotate-x-55 rotate-y-0 rotate-z-30'
              }"
            >
              <nuxt-img
                v-for="screenshot in darkModeScreenshots"
                :key="screenshot"
                :src="`/pages/dark-${screenshot}.png`"
                width="460"
                height="258"
                class="aspect-video border border-default rounded-lg bg-white"
              />
            </u-marquee>
          </div>
        </u-page-section>
      </u-page-body>
    </u-page>
  </u-container>
</template>
