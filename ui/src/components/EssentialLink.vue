<template>
  <q-item
    clickable
    :tag="to ? undefined : 'a'"
    :target="to ? undefined : '_blank'"
    :to="to"
    :href="to ? undefined : link"
    :exact="exact"
  >
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
export interface EssentialLinkProps {
  title: string;
  caption?: string;
  link?: string;
  icon?: string;
  to?: string;
  exact?: boolean;
}
withDefaults(defineProps<EssentialLinkProps>(), {
  caption: '',
  link: '#',
  icon: '',
  to: '',
  exact: false,
});
</script>
