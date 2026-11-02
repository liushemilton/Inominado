<script setup>
import { useRouter } from 'vue-router'

import TestAreaView from '../../Views/TestAreaView.vue'
import { ROUTE_NAMES } from '../names.js'

const router = useRouter()

function handleBack() {
  router.push({ name: ROUTE_NAMES.roadmap })
}
</script>

<template>
  <TestAreaView @back="handleBack" />
</template>
