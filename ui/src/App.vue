<template>
  <suspense>
    <router-view />
  </suspense>
</template>

<script setup lang="ts">
import './services/registerCoiServcieWorker';
</script>
