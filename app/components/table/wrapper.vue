<script setup lang="ts"></script>

<template>
  <u-dashboard-panel>
    <template #header>
      <u-dashboard-navbar :ui="{ title: 'min-w-fit mr-2' }">
        <template #title>
          <table-page-title />
        </template>

        <template
          #trailing
          v-if="$slots['trailing']"
        >
          <slot name="trailing" />
        </template>

        <template
          #right
          v-if="$slots['navbar-right']"
        >
          <slot name="navbar-right" />
        </template>
      </u-dashboard-navbar>

      <u-dashboard-toolbar>
        <slot name="toolbar" />
      </u-dashboard-toolbar>
    </template>

    <template #body>
      <slot />
    </template>

    <template
      #footer
      v-if="$slots['footer']"
    >
      <div class="font-semibold py-2 border-t border-muted text-center text-sm">
        <slot name="footer" />
      </div>
    </template>
  </u-dashboard-panel>
</template>
