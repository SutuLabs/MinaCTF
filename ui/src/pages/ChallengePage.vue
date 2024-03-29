<template>
  <q-page class="row content-start">
    <article v-if="!challengeDetail" class="q-mx-md">
      <p class="q-my-md">Challenge not found!</p>
    </article>
    <article v-else-if="!walletExist" class="q-mx-md">
      <p class="q-my-md">
        You need to install
        <a
          href="https://chrome.google.com/webstore/detail/auro-wallet/cnmamaachppnkjgnildpdmkaakejnhae"
          target="_blank"
          >Auro Wallet <q-icon name="open_in_new"></q-icon
        ></a>
        to continue.
      </p>
    </article>
    <article v-else-if="!publicKey" class="q-mx-md">
      <p class="q-my-md">You must connect with your Auro wallet</p>
      <q-btn
        class="q-my-md"
        @click="connect()"
        color="primary"
        label="Connect Wallet"
      />
    </article>
    <template v-else>
      <article class="q-mx-md">
        <p class="q-my-md">
          You are logged in as
          <q-chip square icon="key">
            {{ publicKey }}
          </q-chip>
        </p>
        <h6 class="q-my-md">Challenge</h6>
        <p>
          {{ challengeDetail.title }}
        </p>
        <h6 class="q-my-md">Help Info</h6>
        <p>
          <b> Create an account and request gas: </b>
          <br />
          You can request test MINA using the
          <a
            :href="'https://faucet.minaprotocol.com/?address=' + publicKey"
            target="_blank"
            >faucet1 <q-icon name="open_in_new"></q-icon>
          </a>
          or
          <a href="https://berkeley.minaexplorer.com/faucet" target="_blank"
            >faucet2 <q-icon name="open_in_new"></q-icon> </a
          >.
        </p>
        <p>
          <b> Compile & Run & Modify the code, refer below docs: </b>
          <br />
          SnarkyJS:
          <a
            href="https://docs.minaprotocol.com/zkapps/snarkyjs"
            target="_blank"
            >https://docs.minaprotocol.com/zkapps/snarkyjs
            <q-icon name="open_in_new"></q-icon>
          </a>
        </p>
        <h6 v-if="step > 0" class="q-my-md">Deployment Contract</h6>
        <p v-if="step > 0">
          <a
            v-if="contractId"
            :href="'https://berkeley.minaexplorer.com/wallet/' + contractId"
            target="_blank"
          >
            <q-chip square icon="open_in_new">
              {{ contractId }}
            </q-chip>
          </a>
          <span v-else> Not deploy yet, click Deploy to start </span>
        </p>
      </article>
      <div class="full-width"></div>
      <div class="full-width container">
        <q-stepper
          v-model="step"
          class="q-ma-md"
          ref="stepper"
          animated
          active-icon="location_pin"
          active-color="primary"
          done-color="green"
        >
          <q-step :name="1" prefix="1" :done="step > 1" title="Deploy">
            <p class="q-my-md">
              Step1: Click "Deploy" button to let platform create a new account
              and deploy the challenge contract for you.
            </p>
            <q-btn
              class="q-my-md full-width"
              @click="deploy()"
              :loading="isDeploying"
              color="primary"
              label="Deploy"
            >
              <template v-slot:loading>
                <q-spinner-hourglass class="on-left" />
                <span v-if="deployingStage == 'Preparing'">Preparing</span>
                <span v-if="deployingStage == 'GettingSignature'"
                  >Authenticate</span
                >
                <span v-if="deployingStage == 'GettingTx'">Getting Tx</span>
                <span v-if="deployingStage == 'SendTx'">Send Tx</span>
                <span v-if="deployingStage == 'GettingOnChainStatus'"
                  >Getting Tx Status</span
                >
                <span v-if="deployingStage == 'WaitingTxOnChain'"
                  >Waiting Tx On-chain</span
                >
              </template>
            </q-btn>
            <p
              v-if="
                deployingStage == 'GettingOnChainStatus' ||
                deployingStage == 'WaitingTxOnChain'
              "
              class="q-my-md text-grey"
            >
              Hint: Mina block generation time is average 3 minutes, but may
              take up to 10 minutes in some scenario, you need to wait the
              transaction included in the block to start your challenge. Check
              following transaction on blockchain explorer for detail:
            </p>
            <p v-if="txHash" class="q-my-md">
              <a
                v-if="txHash"
                :href="
                  'https://berkeley.minaexplorer.com/transaction/' + txHash
                "
                target="_blank"
              >
                <q-chip square icon="open_in_new">
                  {{ txHash }}
                </q-chip>
              </a>
            </p>
          </q-step>

          <q-step :name="2" prefix="2" :done="step > 2" title="Capture">
            <p class="q-my-md">
              Step2: Read the contract code, try to work out the challenge, and
              let flag field filled with right value.
            </p>
            <q-btn
              class="q-my-md full-width"
              @click="download()"
              color="primary"
              label="Download Project"
            />
            <p class="q-my-md">
              Step3: Click "Complete" button to ask server check your solution.
            </p>
            <q-btn
              class="q-my-md full-width"
              @click="submit()"
              :loading="isSubmitting"
              color="deep-orange"
              label="Complete"
            >
              <template v-slot:loading>
                <q-spinner-hourglass class="on-left" />
                <span v-if="submitStage == 'Preparing'">Preparing</span>
                <span v-if="submitStage == 'CheckStatus'">Checking</span>
                <span v-if="submitStage == 'SubmitCheck'">Submitting</span>
              </template>
            </q-btn>
            <p v-if="submitError" class="q-my-md text-negative">
              {{ submitError }}
            </p>
          </q-step>

          <q-step
            :name="3"
            :done="step > 2"
            prefix="3"
            title="Done"
            active-icon="check"
            active-color="green"
          >
            Congratulations, you have done the challenge.
          </q-step>
        </q-stepper>
        <q-inner-loading :showing="isLoading">
          <q-spinner-puff size="50px" color="primary" />
        </q-inner-loading>

        <q-banner
          v-if="step == 0 && !isLoading"
          rounded
          class="bg-deep-orange-8 text-white q-ma-md"
        >
          Sorry, the server is temporarily unavailable, please try again later.

          <template v-slot:action>
            <q-btn
              flat
              color="white"
              label="Try Again"
              icon="refresh"
              @click="getInfo()"
            />
          </template>
        </q-banner>
        <q-btn
          v-if="step > 1"
          class="q-ma-md float-right"
          @click="reset()"
          color="grey"
          flat
          label="Reset and try again"
        />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { QStepper, useQuasar } from 'quasar';
import { fetchAccount } from '../../../contracts/utils/fetchAccount';
import * as contract from 'src/services/contract';
import { ref, Ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  challengeData,
  ChallengeEntity,
} from 'app/../contracts/server/challengeData';
import { saveAs } from 'file-saver';
import { packPlaygroundProject } from 'src/services/playgroundPacker';

const $q = useQuasar();
const endpointUrl =
  process.env.VUE_APP_MINA_NETWORK ??
  'https://proxy.berkeley.minaexplorer.com/graphql';

const route = useRoute();
const challengeName = route.params.id as string;

const challengeDetail: ChallengeEntity | undefined =
  challengeData[challengeName];

const stepper = ref(QStepper);
const step = ref(0);
const publicKey = ref('');
const contractId = ref('');
const txHash = ref('');
const walletExist = ref(false);
const isDeploying = ref(false);
const deployingStage: Ref<
  | 'Preparing'
  | 'SendTx'
  | 'GettingSignature'
  | 'GettingTx'
  | 'WaitingTxOnChain'
  | 'GettingOnChainStatus'
> = ref('Preparing');
const isSubmitting = ref(false);
const submitStage: Ref<'Preparing' | 'CheckStatus' | 'SubmitCheck'> =
  ref('Preparing');
const submitError = ref('');

const score = ref(-1);
const startTime = ref(0);
const captureTime = ref(0);

const isLoading = ref(false);

const mina = window.mina;

if (mina && challengeDetail) {
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
  try {
    isLoading.value = true;
    const status = await contract.getStatus(publicKey.value);
    const c = status.challenges.filter((_) => _.name == challengeName)[0];
    if (c) {
      contractId.value = c.contractId;
      score.value = c.score;
      startTime.value = c.startTime;
      captureTime.value = c.captureTime;
      if (captureTime.value > 0) {
        step.value = 3;
      } else {
        step.value = 2;
      }
    } else {
      step.value = 1;
    }
  } finally {
    isLoading.value = false;
  }
}

async function deploy() {
  isDeploying.value = true;
  try {
    deployingStage.value = 'Preparing';
    const { contractId: cid, txHash: th } = await contract.deploy(
      challengeName,
      (stage) => {
        switch (stage) {
          case 'sign':
            deployingStage.value = 'GettingSignature';
            break;
          case 'send':
            deployingStage.value = 'SendTx';
            break;
          case 'fetch':
            deployingStage.value = 'GettingTx';
            break;

          default:
            break;
        }
      }
    );
    contractId.value = cid;
    txHash.value = th;
    checkDeployment();
  } catch (error) {
    if (error instanceof Error) {
      $q.notify({ message: error.message, color: 'negative' });
    } else {
      console.warn('error during deploy', error);
    }
    isDeploying.value = false;
  }
}

async function checkDeployment() {
  deployingStage.value = 'GettingOnChainStatus';
  const response = await fetchAccount(
    { publicKey: contractId.value },
    endpointUrl
  );
  let accountExists = response.account !== undefined;
  accountExists = response.account?.zkappState !== undefined;
  if (accountExists) {
    stepper.value.next();
    isDeploying.value = false;
  } else {
    if (isDeploying.value) {
      deployingStage.value = 'WaitingTxOnChain';
      setTimeout(() => {
        checkDeployment();
      }, 8000);
    }
  }
}

async function submit() {
  isSubmitting.value = true;
  submitError.value = '';
  try {
    if (!challengeDetail) {
      submitError.value = 'challenge not found';
      return;
    }
    submitStage.value = 'CheckStatus';
    const response = await fetchAccount(
      { publicKey: contractId.value },
      endpointUrl
    );
    const state = response.account?.zkappState;
    const flagpos = challengeDetail.flagPosition;
    const curflag = state?.[flagpos];
    if (!curflag) {
      submitError.value = 'wrong contract';
      return;
    }

    if (challengeDetail.flagNumber != BigInt(curflag)) {
      submitError.value = 'flag not caught.';
      return;
    }

    submitStage.value = 'SubmitCheck';
    const ret = await contract.submitCapture(contractId.value, challengeName);
    if (ret.success) {
      stepper.value.next();
    } else {
      submitError.value = ret.error ?? '';
    }
  } finally {
    isSubmitting.value = false;
  }
}

function download() {
  packPlaygroundProject(challengeName, contractId.value).then(function (
    content
  ) {
    saveAs(content, challengeName + '.zip');
  });
}

function reset() {
  $q.dialog({
    title: 'Confirm',
    message: 'Reset challenge will also clear your point gained, confirm?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    step.value = 1;
  });
}
</script>
