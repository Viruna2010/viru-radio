const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - SUPERB JINGLE MIX ACTIVE! 🛡️🔊🔥'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');
    
    // 🎵 ජින්ගල් එක මියුසික් ෆෝල්ඩරය ඇතුළේ ඇති බවට තහවුරු කරයි
    const jingleFile = path.join(musicDir, 'jingle.mp3');

    // ප්ලේලිස්ට් එක හදද්දී ජින්ගල් එක සින්දුවක් විදිහට ප්ලේ නොවෙන්න අයින් කරනවා
    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3') && f !== 'jingle.mp3');
    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("--- [ULTIMATE TEST] STREAMING WITH MUSIC FOLDER JINGLE ---");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.01',
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath,
        '-stream_loop', '-1', '-i', jingleFile,
        '-filter_complex', 
        // 🎼 MUSIC: High Bass + Shield (volume=1.5)
        '[2:a]atempo=1.08,asetrate=44100*1.05,aresample=44100,volume=1.5[shielded];' +
        // 🎤 JINGLE: තත්පර 2න් 2ට ලූප් වෙනවා + Volume 40.0 කටම වැඩි කළා
        '[3:a]aresample=44100,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=40.0,adelay=2000|2000,aloop=loop=-1:size=2*44100[jingles];' +
        // 🎚️ FINAL MIX: සින්දුවයි හඬයි දෙකම පට්ට ගැම්මට Mix කරනවා
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
