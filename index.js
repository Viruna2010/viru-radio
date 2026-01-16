const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - Ultimate Copyright Shield Active! 🛡️🛡️🛡️'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');
    const jingleFile = path.join(__dirname, 'jingle.mp3');

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting VIRU FM: Maximum Shield Mode Engaged...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,                 // 0: Video
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.04',       // 1: Rain (Extra Protection)
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, // 2: Music
        '-stream_loop', '-1', '-i', jingleFile,               // 3: Jingle
        '-filter_complex', 
        // 🛡️ THE ULTIMATE SHIELD: 
        // Pitch 5% higher, Speed 8% faster, Chorus effect for stereo change, Frequency limits
        '[2:a]atempo=1.08,asetrate=44100*1.05,aresample=44100,volume=1.4,highpass=f=200,lowpass=f=14500,chorus=0.5:0.9:50:0.4:0.25:2[shielded];' +
        // 🎤 JINGLE: 60s delay + Boosted Volume 3.0
        '[3:a]adelay=60000|60000,aloop=loop=-1:size=2*44100,volume=3.0[jingles];' +
        // Mixing: Jingle gets priority (Weight 20), Music gets lower priority (Weight 7)
        '[shielded][jingles]amix=inputs=2:duration=first:weights=7 20[mixed];' +
        '[1:a][mixed]amix=inputs=2:duration=shortest:weights=4 10[out]',
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
