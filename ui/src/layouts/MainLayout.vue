<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> Mina CTF </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Navigation </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EssentialLink, {
  EssentialLinkProps,
} from 'components/EssentialLink.vue';

const essentialLinks: EssentialLinkProps[] = [
  {
    title: 'Challenges',
    caption: 'Start here',
    icon: 'receipt_long',
    to: '/challenges',
  },
  {
    title: 'Scoreboard',
    caption: 'See your rank',
    icon: 'leaderboard',
    to: '/scoreboard',
  },
  // {
  //   title: 'Login',
  //   caption: 'Login to compete challenges',
  //   icon: 'login',
  //   to: '/login'
  // },
  // {
  //   title: 'Profile',
  //   caption: 'See your profile',
  //   icon: 'face',
  //   to: '/profile'
  // },
  // {
  //   title: 'Github 🔗',
  //   caption: 'github.com/sutulabs/minactf',
  //   icon: 'code',
  //   link: 'https://github.com/sutulabs/minactf'
  // },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
