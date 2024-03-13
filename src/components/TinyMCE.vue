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

<script lang="ts">
    import { Buffer } from 'buffer'
    // 添加 Buffer 全局变量
    // @ts-ignore
    window.Buffer = window.Buffer || Buffer
</script>

<script setup lang="ts">
    import { ref, onMounted, watch } from 'vue'
    import * as Docx from 'docx-preview'
    import { fromBuffer } from 'file-type/core'
    import { RawEditorOptions, Editor } from '../../public/tinyMCE/tinymce'
    import useTinyMCE from '../hooks/useTinyMCE'

    const emits = defineEmits(['update:modelValue'])
    const props = defineProps<{
        modelValue: string
    }>()

    const TINY_MCE_ID = 'editor_' + Date.now()

    const { init: initTinyMCE } = useTinyMCE()
    let tinyMCEEditor: Editor

    const importWordUploadRef = ref()
    const isEditorInitialized = ref(false)
    const currentValue = ref('')

    const initOptions: RawEditorOptions = {
        selector: '#' + TINY_MCE_ID,
        toolbar: 'importWord',
        // 允许添加 style 标签
        valid_children: '+body[style]',
        // 防止 tinyMCE 移除没有属性的 span 标签，保留所有标签的 style 属性
        extended_valid_elements: 'span|*[style]',
        images_upload_handler: blobInfo => {
            return new Promise(async () => {
                let file = blobInfo.blob()

                if (isUnknownTypeBlob(blobInfo.blobUri())) {
                    const blob = blobInfo.blob()
                    const blobType = await fromBuffer(await blob.arrayBuffer())
                    file = new File(
                        [blob],
                        `${Date.now()}.${blobType?.ext || 'blob'}`
                    )
                }

                console.log(file)

                // 上传文件 uploadImage
                // resolve(result.url)

                // 主动触发 input 事件，图片地址替换之后不会主动触发 input 事件
                setTimeout(() => {
                    tinyMCEEditor.fire('input')
                })
            })
        },
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

    const isUnknownTypeBlob = (blobUri: string) => {
        return blobUri.startsWith('blob')
    }

    const getContent = () => {
        return (
            tinyMCEEditor?.getContent({
                format: 'html'
            }) || ''
        )
    }

    // docx-preview 没有提供直接返回 html 的方法，所以用创建 dom 接收 html 的方法“曲线救国”
    const renderHtmlAsync = async (wordFile: File) => {
        const importWordUploadContainerDom = document.createElement('div')

        await Docx.renderAsync(
            wordFile,
            importWordUploadContainerDom,
            undefined,
            {
                // 取消宽高限制，不然会固定一个页面大小，展示效果不好
                ignoreHeight: true,
                ignoreWidth: true
            }
        )

        // 获取 style 标签
        const wordStyleContent = Array.from(
            importWordUploadContainerDom.querySelectorAll('style')
        )
            .map(dom => dom.outerHTML)
            .join('')
        // 去除 word 的纸页容器
        const wordHtmlContent = Array.from(
            importWordUploadContainerDom.querySelectorAll('section.docx')
        )
            .map(dom => dom.innerHTML)
            .join('')

        return wordStyleContent + wordHtmlContent
    }

    const handleWordFileUpload = async (e: Event) => {
        const wordFile = (e.target as HTMLInputElement).files?.[0]
        if (!wordFile) return

        // 将上传文件的 input value 置空，否则会出现第二次上传相同文件的时候不回调的问题
        importWordUploadRef.value.value = null

        const wordHtmlContent = await renderHtmlAsync(wordFile)

        // 将导入的 word 内容追加到富文本内容中
        tinyMCEEditor.setContent(tinyMCEEditor.getContent() + wordHtmlContent)
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
