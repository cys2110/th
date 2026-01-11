<script setup lang="ts">
import type { PageFeatureProps } from "@nuxt/ui"

definePageMeta({ name: "home" })
useHead({ title: "Home" })

// Features
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
const screenshots: string[] = []
</script>

<template>
  <u-container class="max-w-6xl">
    <u-page>
      <u-page-body>
        <u-page-section
          title="Tennis History in the Open Era"
          description="Explore tennis since 1968"
          icon="twemoji:tennis"
          orientation="vertical"
          :features="features"
        >
          <div class="relative w-full h-100 overflow-hidden rounded-lg">
            <u-marquee
              v-for="i in Array.from({ length: 3 })"
              :key="(i as number)"
              :reverse="(i as number) % 2 === 1"
              orientation="vertical"
              :overlay="false"
              :ui="{
                root: '[--duration:40s] absolute w-[460px] -left-[100px] -top-[300px] h-[940px] transform-3d rotate-x-55 rotate-y-0 rotate-z-30'
              }"
            >
              <nuxt-img
                v-for="screenshot in screenshots"
                :key="screenshot"
                :src="screenshot"
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
