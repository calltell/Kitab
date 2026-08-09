import { EdgeTTS } from 'node-edge-tts';
const tts = new EdgeTTS({
    voice: 'fa-IR-DilaraNeural',
    lang: 'fa-IR',
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
});
tts.ttsPromise('سلام بر شما').then(res => console.log('success')).catch(console.error);
