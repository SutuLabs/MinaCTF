<template>
  <q-page class="q-mt-lg q-ml-md">
    <div class="row fit items-start q-col-gutter-md">
      <div
        class="col-xs-12 col-sm-6 col-md-4"
        v-for="c in challenges"
        :key="c.name"
      >
        <q-card flat bordered>
          <q-card-section horizontal class="row fit">
            <q-card-section class="q-pt-xs col-8">
              <div class="text-overline">
                {{ (c.difficulty ?? '').toUpperCase() }}
              </div>
              <div class="text-h5 q-mt-sm q-mb-xs">{{ c.title }}</div>
              <div class="text-caption text-grey">
                {{ c.caption }}
              </div>
            </q-card-section>

            <q-card-section class="col-4 flex flex-center">
              <q-icon :name="c.icon" size="xl" />
            </q-card-section>
          </q-card-section>

          <q-separator />

          <q-card-actions class="row">
            <q-btn flat> {{ c.point }} Points </q-btn>
            <q-btn
              class="col-grow"
              color="primary"
              :to="'/challenges/' + c.name"
            >
              DETAIL
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// import { ref } from 'vue';

export interface ChallengeEntity {
  title: string;
  caption?: string;
  icon?: string;
  name?: string;
  difficulty?: string;
  point?: number;
}

const challenges: ChallengeEntity[] = [
  {
    title: 'Check in',
    caption: 'Start here, check in',
    icon: 'luggage',
    name: 'checkin',
    difficulty: 'beginner',
    point: 100,
  },
  {
    title: 'Maze',
    caption: 'Find a way',
    icon: 'extension',
    name: 'maze',
    difficulty: 'expert',
    point: 300,
  },
  {
    title: 'Maze',
    caption: 'Find a way',
    icon: 'extension',
    name: 'maze',
    difficulty: 'expert',
    point: 300,
  },
  {
    title: 'Maze',
    caption: 'Find a way',
    icon: 'extension',
    name: 'maze',
    difficulty: 'expert',
    point: 300,
  },
];
</script>
