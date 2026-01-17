const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - WHATSAPP VOICE & BASS FIXED! 🛡️🔊🔥'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');
    const jingleFile = path.join(__dirname, 'jingle.mp3'); // උඹ Rename කරපු WhatsApp Voice එක

    // 🎵 Playlist එක shuffle කරලා හදනවා
    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("--- [SYSTEM START] VIRU FM: WHATSAPP VOICE + ORIGINAL BASS ---");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.01',
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath,
        '-stream_loop', '-1', '-i', jingleFile,
        '-filter_complex', 
        // 🛡️ MUSIC: උඹේ පරණ Ultra Shield එක සහ Bass එක (volume=1.5)
        '[2:a]atempo=1.08,asetrate=44100*1.05,aresample=44100,volume=1.5[shielded];' +
        // 🎤 WHATSAPP VOICE FIX: Mono එක Stereo කරලා 44100Hz වලට Resample කරනවා.
        // Volume 20.0 දාලා තියෙන්නේ උඹේ "Hello" එක පට්ට හයියෙන් ඇහෙන්න.
        '[3:a]aresample=44100,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,adelay=60000|60000,aloop=loop=-1:size=2*44100,volume=20.0[jingles];' +
        // 🎚️ MIXING: සින්දුවේ Bass එක බස්සන්නේ නැතුව "Hello" එක උඩින් දානවා (Weights 1 1)
        '[shielded][jingles]amix=inputs=2:duration=first:dropout_transition=0:weights=1 1[mixed];' +
        '[1:a][mixed]amix=inputs=2:duration=shortest:weights=1 10[out]',
        '-map', '0:v', '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-b:v', '300k', '-s', '640x360', '-pix_fmt', 'yuv420p', '-g', '60', 
        '-c:a', 'aac', '-b:a', '128k', 
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => console.log(`FFmpeg: ${d}`));
    ffmpeg.on('close', () => setTimeout(startStreaming, 3000));
}

app.listen(port, '0.0.0.0', () => { if (STREAM_KEY) startStreaming(); });
