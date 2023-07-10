<template>
  <q-page class="q-mt-lg q-ml-md">
    <p v-if="publicKey" class="q-my-md">
      You are logged in as
      <q-chip square icon="key">
        {{ publicKey }}
      </q-chip>
    </p>
    <div class="row fit items-start q-col-gutter-md">
      <div
        class="col-xs-12 col-sm-6 col-md-4"
        v-for="(c, name) in challenges"
        :key="name"
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
              <div class="text-caption">
                <span
                  v-if="schallenges?.[name]?.status == 'STARTED'"
                  class="text-primary"
                >
                  STARTED
                </span>
                <span
                  v-else-if="schallenges?.[name]?.status == 'DONE'"
                  class="text-green"
                >
                  DONE
                </span>
                <span v-else class="text-grey"> READY </span>
              </div>
              <q-icon :name="c.icon" size="xl" />
            </q-card-section>
          </q-card-section>

          <q-separator />

          <q-card-actions class="row">
            <q-btn flat> {{ c.point }} Points </q-btn>
            <q-btn class="col-grow" color="primary" :to="'/challenges/' + name">
              DETAIL
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue';
import { challengeData as challenges } from 'app/../contracts/server/challengeData';
import * as contract from 'src/services/contract';
import { ChallengeStatusEntity } from 'app/../contracts/server/model';

const publicKey = ref('');
const walletExist = ref(false);

type ChallengeStatus = 'STARTED' | 'DONE' | 'READY';
interface ExtendChallengeStatusEntity extends ChallengeStatusEntity {
  status: ChallengeStatus;
}

const schallenges: Ref<
  { [key: string]: ExtendChallengeStatusEntity } | undefined
> = ref(undefined);

const mina = window.mina;

if (mina) {
  walletExist.value = true;
  connect();
}

async function connect() {
  if (!mina) return;
  const pk = (await mina.requestAccounts())[0];
  publicKey.value = pk;
  await getInfo();
}

async function getInfo() {
  const status = await contract.getStatus(publicKey.value);
  schallenges.value = status.challenges.reduce((pv, cv) => {
    pv[cv.name] = Object.assign(
      {
        status: (cv.captureTime ?? 0 > 0
          ? 'DONE'
          : cv.startTime ?? 0 > 0
          ? 'STARTED'
          : 'READY') as ChallengeStatus,
      },
      cv
    );
    return pv;
  }, {} as { [key: string]: ExtendChallengeStatusEntity });
}
</script>
