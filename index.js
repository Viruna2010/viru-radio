const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - Zero Risk Copyright Shield Active! 🛡️✨'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');
    const jingleFile = path.join(__dirname, 'jingle.mp3');

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting Stream with Maximum Copyright Protection...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.03',
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath,
        '-stream_loop', '-1', '-i', jingleFile,
        '-filter_complex', 
        // 🛡️ THE ULTIMATE COPYRIGHT SHIELD:
        // 1. Pitch & Speed වෙනස් කරනවා (1.06x speed, 3% higher pitch)
        // 2. High Frequency කපනවා (lowpass)
        // 3. Stereo width වෙනස් කරනවා (chorus) - මේකෙන් Bot එකට සින්දුව අඳුරගන්න බැරි වෙනවා
        '[2:a]atempo=1.06,asetrate=44100*1.03,aresample=44100,lowpass=f=15000,chorus=0.5:0.9:50:0.4:0.25:2,volume=1.6[shielded];' +
        // 🎤 Jingle overlay logic
        '[3:a]adelay=60000|60000,aloop=loop=-1:size=2*44100[jingles];' +
        '[shielded][jingles]amix=inputs=2:duration=first:weights=10 9[mixed];' +
        '[1:a][mixed]amix=inputs=2:duration=shortest:weights=3 10[out]',
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
