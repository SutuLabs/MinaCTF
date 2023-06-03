import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'challenges', component: () => import('pages/ChallengePage.vue') },
      { path: 'scoreboard', component: () => import('pages/ScoreboardPage.vue') },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'profile', component: () => import('pages/profilePage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
