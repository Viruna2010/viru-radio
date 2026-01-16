const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

// සර්වර් එක පණ තියෙනවද බලන්න
app.get('/', (req, res) => res.send('VIRU FM 24/7 - Pro Jingle Mode is LIVE! 🎙️🚀'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');
    const jingleFile = path.join(__dirname, 'jingle.mp3'); // ජින්ගල් එක රූට් ෆෝල්ඩරයේ තිබිය යුතුය

    // මියුසික් ෆෝල්ඩරය පරීක්ෂාව
    if (!fs.existsSync(musicDir)) {
        console.error("Error: 'music' folder not found!");
        return;
    }

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) {
        console.error("Error: No MP3 files found!");
        return;
    }

    // සින්දු Shuffle කිරීම
    files.sort(() => Math.random() - 0.5);

    // ප්ලේලිස්ට් එක සෑදීම
    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting Optimized Stream: Jingle Overlay every 60s...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,                 // 0: වීඩියෝව
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.03',       // 1: වැස්සේ හඬ
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, // 2: සින්දු
        '-stream_loop', '-1', '-i', jingleFile,               // 3: ජින්ගල් එක
        '-filter_complex', 
        // 🚀 ලොජික් එක: සින්දුවේ වේගය වෙනස් කර, ජින්ගල් එක තත්පර 60ක් පරක්කු කර මික්ස් කිරීම
        '[2:a]atempo=1.04,asetrate=44100*1.025,aresample=44100,volume=1.5[music];' +
        '[3:a]adelay=60000|60000,aloop=loop=-1:size=2*44100[jingles];' +
        '[music][jingles]amix=inputs=2:duration=first:weights=10 9[mixed];' +
        '[1:a][mixed]amix=inputs=2:duration=shortest:weights=3 10[out]',
        '-map', '0:v', 
        '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-b:v', '300k', 
        '-maxrate', '300k', 
        '-bufsize', '600k', 
        '-s', '640x360', 
        '-pix_fmt', 'yuv420p', '-g', '60', 
        '-c:a', 'aac', '-b:a', '128k', 
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    // FFmpeg ලොග්ස් බලාගන්න (අත්‍යවශ්‍යයි)
    ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg: ${data}`);
    });

    ffmpeg.on('close', (code) => {
        console.log(`Stream Restarting (Code: ${code})`);
        setTimeout(startStreaming, 3000);
    });
}

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    if (STREAM_KEY) {
        startStreaming();
    } else {
        console.error("STREAM_KEY missing!");
    }
});
