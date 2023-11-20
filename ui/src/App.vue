<template>
  <suspense>
    <router-view />
  </suspense>
</template>

<script setup lang="ts">
import './services/registerCoiServcieWorker';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
</script>
