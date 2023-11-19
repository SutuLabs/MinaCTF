<template>
  <q-page class="row content-start container">
    <p class="q-ma-md text-body1 text-weight-bold">
      Play CTF game is a good way to practice your programming skills.
    </p>

    <p class="q-ma-md">
      <img class="full-width" src="../assets/landscape.jpg" />
    </p>

    <p class="q-ma-md">
      <b>CTF (aka Capture The Flag)</b> is a competition where teams or
      individuals have to solve a number of challenges. The one that
      solves/collects most flags the fastest wins the competition. Once each
      challenge has been solved successfully, the user will find a "flag" within
      the challenge that is proof of completion.
    </p>

    <p class="q-ma-md">
      Visit this
      <a
        href="https://twitter.com/icerdesign/status/1689286599823986689"
        target="_blank"
        >link</a
      >
      for a comprehensive demonstration of the entire process.
    </p>

    <p class="q-ma-md">
      <q-btn to="/challenges" label="Start" icon="flag" color="primary" push />
      <q-btn
        to="/scoreboard"
        label="Score Board"
        icon="military_tech"
        color="secondary"
        class="q-mx-md"
        push
      />
    </p>
  </q-page>
</template>

<script setup lang="ts">
// import { ref } from 'vue';
</script>
