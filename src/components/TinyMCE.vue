<template>
    <div class="container">
        <textarea :id="TINY_MCE_ID"></textarea>

        <input
            type="file"
            ref="importWordUploadRef"
            accept=".docx"
            style="display: none"
            @input="handleWordFileUpload"
        />
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted, watch } from 'vue'
    import { RawEditorOptions, Editor } from '../../public/tinyMCE/tinymce'
    import useTinyMCE from '../hooks/useTinyMCE'

    const emits = defineEmits(['update:modelValue'])
    const props = defineProps<{
        modelValue: string
    }>()

    const BASE_URL = '/tinyMCE'
    const TINY_MCE_ID = 'editor_' + Date.now()

    const { init: initTinyMCE } = useTinyMCE()
    let tinyMCEEditor: Editor

    const importWordUploadRef = ref()
    const isEditorInitialized = ref(false)
    const currentValue = ref('')

    const initOptions: RawEditorOptions = {
        selector: '#' + TINY_MCE_ID,
        language_url: BASE_URL + '/langs/zh-Hans.js',
        language: 'zh-Hans',
        base_url: BASE_URL,
        suffix: '.min',
        toolbar: 'importWord',
        init_instance_callback: tinyMCEEditor => {
            tinyMCEEditor.setContent(props.modelValue || '', {
                format: 'html'
            })
            isEditorInitialized.value = true
        },
        setup: editor => {
            editor.on('input', () => {
                currentValue.value = getContent()
                emits('update:modelValue', currentValue.value)
            })
            editor.on('ExecCommand', () => {
                if (!isEditorInitialized.value) return

                currentValue.value = getContent()
                emits('update:modelValue', currentValue.value)
            })

            editor.ui.registry.addButton('importWord', {
                text: '导入word',
                // icon:'', // 目前使用文字按钮，如果需要图标展示，根据文档中自定义图标中的内容进行配置
                onAction: function () {
                    //触发上传组件
                    importWordUploadRef.value.click()
                }
            })
        }
    }

    const handleWordFileUpload = () => {}

    const getContent = () => {
        return (
            tinyMCEEditor?.getContent({
                format: 'html'
            }) || ''
        )
    }

    watch(
        () => props.modelValue,
        newValue => {
            if (newValue !== currentValue.value) {
                currentValue.value = newValue === null ? '' : newValue
                if (tinyMCEEditor) {
                    tinyMCEEditor.setContent(currentValue.value, {
                        format: 'html'
                    })
                }
            }
        },
        {
            immediate: true
        }
    )

    onMounted(async () => {
        ;[tinyMCEEditor] = await initTinyMCE(initOptions)
    })
</script>

<style scoped>
    .tox-tinymce-aux.tox {
        z-index: 1000000;
    }
</style>
