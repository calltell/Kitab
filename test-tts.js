const googleTTS = require('google-tts-api');
const url = googleTTS.getAudioUrl('سلام', { lang: 'fa', slow: false, host: 'https://translate.google.com' });
fetch(url).then(r => console.log(r.status)).catch(console.error);
