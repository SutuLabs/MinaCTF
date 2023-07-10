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

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="column justify-between no-wrap"
    >
      <q-list>
        <q-item-label header> Navigation </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
      <q-item class="col-grow"></q-item>
      <q-item class="justify-center">
        <div class="text-center">
          Created with ❤️ by
          <a
            href="https://github.com/SutuLabs"
            target="_blank"
            class="decoration-none text-light-blue-14"
          >
            SutuLabs
          </a>

          <br />
          Version: {{ version ?? 'unknown' }}
        </div>
      </q-item>
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

const version = process.env.VUE_APP_VERSION;

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

<style>
.decoration-none {
  text-decoration: none;
}
</style>
