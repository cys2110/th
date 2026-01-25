<template>
  <u-page-card
    highlight
    :ui="{ body: 'w-full' }"
  >
    <template #title>
      <u-skeleton class="h-5 w-3/4" />
    </template>

    <template #description>
      <div class="grid grid-cols-2">
        <div class="*:not-first:ml-3 *:my-0.5">
          <div>Singles Career High</div>
          <u-skeleton class="h-3 w-1/6" />
          <u-skeleton class="h-3 w-1/2" />
        </div>

        <div class="*:not-first:ml-3 *:my-0.5">
          <div>Doubles Career High</div>
          <u-skeleton class="h-3 w-1/6" />
          <u-skeleton class="h-3 w-1/2" />
        </div>
      </div>
    </template>
  </u-page-card>
</template>
