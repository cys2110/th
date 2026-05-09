<script setup lang="ts">
const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-card :ui="{ root: 'ring-primary' }">
    <template #header>
      <div class="flex justify-between">
        <u-skeleton class="h-3 w-25" />
        <u-skeleton class="h-3 w-25" />
      </div>
      <div class="flex justify-between">
        <u-skeleton class="h-3 w-25" />
        <u-skeleton class="h-3 w-25" />
      </div>
    </template>

    <div class="grid grid-rows-2 grid-flow-col gap-3 items-center">
      <div>
        <u-skeleton class="h-5 w-40" />
      </div>
      <div>
        <u-skeleton class="h-5 w-40" />
      </div>

      <div>
        <u-icon
          :name="icons.success"
          class="text-success"
        />
      </div>
      <div></div>

      <!--Score-->
      <div class="grid grid-cols-3 text-center">
        <div
          v-for="_ in 3"
          :key="_"
        >
          <u-skeleton class="h-3 w-5" />
        </div>
      </div>

      <div class="grid grid-cols-3 text-center">
        <div
          v-for="_ in 3"
          :key="_"
        >
          <u-skeleton class="h-3 w-5" />
        </div>
      </div>
    </div>

    <template #footer>
      <u-skeleton class="h-5 w-full" />
    </template>
  </u-card>
</template>
