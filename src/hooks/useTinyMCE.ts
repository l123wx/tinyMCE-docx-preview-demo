import { RawEditorOptions, Editor } from '../../public/tinyMCE/tinymce'

let isScriptLoading = false
const initMethodList: Array<() => Promise<void>> = []

const isTinyMCENotReadyToInit = () =>
    isScriptLoading === true || !window.tinyMCE
const isBeforeTinyMCEInit = () => isScriptLoading === false && !window.tinyMCE

const useTinyMCE = () => {
    const init = (initOptions: RawEditorOptions) => {
        return new Promise<Editor[]>(async resolve => {
            const initMethod = async () =>
                resolve(await window.tinyMCE.init(initOptions))

            if (isTinyMCENotReadyToInit()) {
                initMethodList.push(initMethod)
            } else {
                initMethod()
            }

            if (isBeforeTinyMCEInit()) {
                isScriptLoading = true
                const script = document.createElement('script')
                script.src = '/tinyMCE/tinymce.min.js'
                script.onload = async () => {
                    isScriptLoading = false
                    while (initMethodList.length) {
                        initMethodList[0]()
                        initMethodList.splice(0, 1)
                    }
                }
                document.body.appendChild(script)
            }
        })
    }

    return {
        init
    }
}

export default useTinyMCE
