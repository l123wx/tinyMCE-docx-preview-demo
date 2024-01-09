import { TinyMCE } from '../public/tinyMCE/tinymce'

declare global {
    interface Window {
        tinyMCE: TinyMCE
    }
}