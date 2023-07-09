<template>
  <q-page class="row content-start">
    <article v-if="!walletExist" class="q-mx-md">
      <p class="q-my-md">You need to install Auro Wallet to continue.</p>
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
          {{ $route.params.id }}
        </p>
        <h6 class="q-my-md">Description</h6>
        <p>
          {{ description }}
        </p>
        <h6 class="q-my-md">Deployment Contract</h6>
        <p>
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
      <div class="full-width">
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
                <span v-if="(deployingStage = 'Preparing')">Preparing</span>
                <span v-if="(deployingStage = 'GettingSignature')"
                  >Authenticate</span
                >
                <span v-if="(deployingStage = 'GettingTx')">Getting Tx</span>
                <span v-if="(deployingStage = 'SendTx')">Send Tx</span>
                <span v-if="(deployingStage = 'GettingOnChainStatus')"
                  >Getting Tx Status</span
                >
                <span v-if="(deployingStage = 'WaitingTxOnChain')"
                  >Waiting Tx On-chain</span
                >
              </template>
            </q-btn>
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
            Step2: Read the contract code, try to work out the challenge, and
            let flag field filled with right value.
            <q-btn
              class="q-my-md"
              @click="($refs.stepper as QStepper).next()"
              color="deep-orange"
              label="Continue"
            />
          </q-step>

          <q-step :name="3" :done="step > 3" prefix="3" title="Submit">
            Step3: Click "Get Flag" button to submit the transaction hash which
            has triggered the Flag event.
            <q-input
              filled
              bottom-slots
              v-model="txid"
              label="Transaction Id"
              :dense="true"
            >
              <template v-slot:before>
                <q-icon name="flag" />
              </template>

              <template v-slot:append>
                <q-icon
                  v-if="txid !== ''"
                  name="close"
                  @click="txid = ''"
                  class="cursor-pointer"
                />
              </template>

              <template v-slot:hint>e.g. 0x..... </template>
            </q-input>
            <q-btn
              class="q-my-md"
              @click="submit()"
              color="deep-orange"
              label="Submit"
            />
          </q-step>

          <q-step
            :name="4"
            :done="step > 3"
            prefix="4"
            title="Done"
            active-icon="check"
            active-color="green"
          >
            Congraduations, you have done the challenge.
          </q-step>
        </q-stepper>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { QStepper } from 'quasar';
import { fetchAccount } from 'snarkyjs';
import * as contract from 'src/services/contract';
import { ref, Ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const stepper = ref(QStepper);
const step = ref(1);
// const compiled = ref(false);
const description = ref('');
const publicKey = ref('');
const contractId = ref('');
const txid = ref('');
const txHash = ref('');
const walletExist = ref(false);
const allDone = ref(false);
const isDeploying = ref(false);
const deployingStage: Ref<
  | 'Preparing'
  | 'SendTx'
  | 'GettingSignature'
  | 'GettingTx'
  | 'WaitingTxOnChain'
  | 'GettingOnChainStatus'
> = ref('GettingSignature');

const score = ref(-1);
const startTime = ref(0);
const captureTime = ref(0);

// async function signMessage() {
//   await sign();
// }
// async function compile() {
//   await init();
//   compiled.value = true;
// }
// async function deployContract() {
//   await deploy();
//   // compiled.value = true;
// }

const mina = (window as any).mina; // wallet injection

if (mina == null) {
  walletExist.value = false;
} else {
  walletExist.value = true;
  connect();
}

async function connect() {
  const pk = (await mina.requestAccounts())[0];
  publicKey.value = pk;
  await getInfo();
}

async function getInfo() {
  const status = await contract.getStatus(publicKey.value);
  // console.log(status);
  const c = status.challenges.filter((_) => _.name == route.params.id)[0];
  if (c) {
    contractId.value = c.contractId;
    score.value = c.score;
    startTime.value = c.startTime;
    captureTime.value = c.captureTime;
    stepper.value.next();
    if ((captureTime.value ?? 0) > 0) {
      stepper.value.next();
    }
  }
}

async function deploy() {
  isDeploying.value = true;
  try {
    deployingStage.value = 'Preparing';
    const { contractId: cid, txHash: th } = await contract.deploy((stage) => {
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
    });
    contractId.value = cid;
    txHash.value = th;
    checkDeployment();
  } catch (error) {
    isDeploying.value = false;
  }
}

const endpointUrl = 'http://berkeley.mina.sutulabs.com/graphql';
async function checkDeployment() {
  deployingStage.value = 'GettingOnChainStatus';
  const response = await fetchAccount(
    { publicKey: contractId.value },
    endpointUrl
  );
  let accountExists = response.account !== undefined;
  accountExists = response.account?.zkapp?.appState !== undefined;
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

function submit() {
  stepper.value.next();
}
</script>
