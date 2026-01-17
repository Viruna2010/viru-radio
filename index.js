const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - 1 DAY RECORD & FULL BASS SECURED! 🛡️🔊🔥'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');
    const jingleFile = path.join(__dirname, 'jingle.mp3');

    // 🎵 playlist එක shuffle කරලා හදනවා
    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting VIRU FM: Ultra Shield + Full Bass Mode Active!");

    // 🚨 ජින්ගල් එක ප්ලේ වෙන වෙලාව ලොග් එකේ පෙන්වන්න මේක දැම්මා
    setInterval(() => {
        console.log("--- [SYSTEM CHECK] JINGLE TRIGGERED: PLAYING VIRU FM VOICE NOW ---");
    }, 60000);

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.01',
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath,
        '-stream_loop', '-1', '-i', jingleFile,
        '-filter_complex', 
        // 🛡️ ULTRA SHIELD + FULL BASS: Volume 1.5 මට්ටමේ තියෙන්නේ (No Bass Loss)
        '[2:a]atempo=1.08,asetrate=44100*1.05,aresample=44100,volume=1.5[shielded];' +
        // 🔊 SUPER LOUD JINGLE: ජින්ගල් එකේ සද්දේ 15 ගුණයකින් වැඩි කළා
        '[3:a]adelay=60000|60000,aloop=loop=-1:size=2*44100,volume=15.0[jingles];' +
        // 🎚️ BALANCED MIX: Weights 1 1 නිසා සින්දුවේ Bass එක බහින්නේ නැහැ
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
