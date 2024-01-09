<template>
    <TinyMCE v-model="value" />
</template>

<script setup lang="ts">
    import { ref } from 'vue'
    import TinyMCE from './components/TinyMCE.vue'

    const value = ref('test')
</script>
