<script setup lang="ts">
definePageMeta({ name: "home" })
useHead({ title: "Home" })

// Features
const features = [
  {
    title: "Results",
    icon: ICONS.event,
    description: "Explore tournament results starting from the Open Era"
  },
  {
    title: "Head to Head",
    icon: ICONS.h2h,
    description: "Examine match ups between players"
  },
  {
    title: "Statistics and Records",
    icon: ICONS.stats,
    description: "Charge up your tennis trivia with fun facts and figures"
  }
]

// Screenshots
const screenshots: string[] = []
</script>

<template>
  <u-container class="max-w-6xl">
    <u-page>
      <u-page-header
        title="Tennis History in the Open Era"
        description="Explore tennis since 1968"
      />
      <u-page-body>
        <u-page-grid>
          <u-page-feature
            v-for="feature in features"
            :key="feature.title"
            v-bind="feature"
          />
        </u-page-grid>
        <div class="relative w-full h-[400px] overflow-hidden rounded-lg">
          <u-marquee
            reverse
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
          <u-marquee
            orientation="vertical"
            :overlay="false"
            :ui="{
              root: '[--duration:40s] absolute w-[460px] -top-[400px] left-[480px] h-[1160px] transform-3d rotate-x-55 rotate-y-0 rotate-z-30'
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
          <u-marquee
            reverse
            orientation="vertical"
            :overlay="false"
            :ui="{
              root: 'hidden md:flex [--duration:40s] absolute w-[460px] -top-[300px] left-[1020px] h-[1060px] transform-3d rotate-x-55 rotate-y-0 rotate-z-30'
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
      </u-page-body>
    </u-page>
  </u-container>
</template>
