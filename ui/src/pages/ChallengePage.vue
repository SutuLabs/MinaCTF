<template>
  <q-page class="row content-start">
    <article class="q-mx-md">
      <h6 class="q-my-md">Challenges</h6>
      <p>
        {{ $route.params.id }}
      </p>
      <h6 class="q-my-md">Description</h6>
      <p>
        {{ description }}
      </p>
      <h6 class="q-my-md">Deployment Contract</h6>
      <p>
        <a v-if="contractId" href="">
          {{ contractId }}
        </a>
        <span v-else> Not deploy yet, click Next to deploy </span>
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
          Step1: Click "Deploy" button to let platform create a new account and
          deploy the challenge contract for you.
          <q-btn
            class="q-my-md"
            @click="compile()"
            color="primary"
            label="Compile"
          />
          <q-btn
            v-if="compiled"
            class="q-my-md"
            @click="deploy()"
            color="deep-orange"
            label="Deploy"
          />
        </q-step>

        <q-step :name="2" prefix="2" :done="step > 2" title="Capture">
          Step2: Read the contract code, try to work out the challenge, and let
          flag field filled with right value.
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
  </q-page>
</template>

<script setup lang="ts">
import { QStepper } from 'quasar';
import { init } from 'src/services/contract';
import { ref } from 'vue';

const stepper = ref(QStepper);
const step = ref(1);
const compiled = ref(false);
const description = ref('');
const contractId = ref('');
const txid = ref('');
const allDone = ref(false);

async function compile() {
  await init();
  compiled.value = true;
}
function deploy() {
  contractId.value = 'conddd';
  stepper.value.next();
}
function submit() {
  stepper.value.next();
}
</script>
