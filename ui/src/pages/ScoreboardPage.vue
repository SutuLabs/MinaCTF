<template>
  <q-page class="">
    <div class="q-pa-md">
      <q-table title="Scores" :rows="scores" :columns="columns" row-key="name">
        <template v-slot:body-cell="props">
          <q-td v-if="props.col.name == 'name'" :props="props">
            {{ props.value }}
          </q-td>
          <q-td v-else :props="props">
            <q-badge v-if="props.value > 0" color="blue" :label="props.value" />
            <q-badge v-else color="grey-4" :label="props.value" />
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { QTableColumn } from 'quasar';
import * as contract from 'src/services/contract';
import { ref, Ref } from 'vue';
import { challengeData as challenges } from 'app/../contracts/server/challengeData';

type ScoreDisplayEntity = {
  [key: string]: string;
} & {
  publicKey: string;
};

const scores: Ref<ScoreDisplayEntity[]> = ref([]);

const columns: QTableColumn[] = [
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left',
    field: 'publicKey',
    format: (val: string) =>
      `${val.slice(0, 5)}...${val.slice(val.length - 5, val.length)}`,
  },
];
for (const ckey in challenges) {
  if (Object.prototype.hasOwnProperty.call(challenges, ckey)) {
    const c = challenges[ckey];
    columns.push({
      name: ckey,
      label: c.title,
      field: ckey,
      sortable: true,
      sort: (a, b) => parseInt(a, 10) - parseInt(b, 10),
      format: (val) => (val ? val : 0),
    });
  }
}

await getInfo();

async function getInfo() {
  const list = await contract.getScoreList();
  scores.value = Object.entries(
    list.scores.reduce((pv, cv) => {
      if (!pv[cv.publicKey]) pv[cv.publicKey] = { publicKey: cv.publicKey };
      pv[cv.publicKey][cv.challenge] = cv.score.toString();
      return pv;
    }, {} as { [key: string]: ScoreDisplayEntity })
  ).map((_) => _[1]);
}
</script>
