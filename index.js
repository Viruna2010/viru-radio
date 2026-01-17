const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

// 🔊 Server Status Message
app.get('/', (req, res) => res.send('VIRU FM - 24/7 LIFETIME MODE ACTIVE! 🛡️🔊'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');
    const jingleFile = path.join(__dirname, 'jingle.mp3');

    // 🎵 Playlist Generation (Randomly Shuffled)
    if (!fs.existsSync(musicDir)) {
        console.log("CRITICAL ERROR: 'music' folder not found!");
        return;
    }

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    
    // 🔍 සින්දු කීයක් අහු වුණාද කියලා ලොග්ස් වල පෙන්වනවා
    console.log(`========================================`);
    console.log(`TOTAL SONGS FOUND IN FOLDER: ${files.length}`);
    console.log(`========================================`);

    if (files.length === 0) {
        console.log("ERROR: No .mp3 files found in music folder!");
        setTimeout(startStreaming, 10000);
        return;
    }

    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting Lifetime Stream: Optimized for 100GB Data Limit...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile, 
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.01', 
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, 
        '-stream_loop', '-1', '-i', jingleFile, 
        '-filter_complex', 
        // 🛡️ Copyright Shield + Bass Boost
        '[2:a]atempo=1.08,asetrate=44100*1.05,aresample=44100,volume=1.6[shielded];' +
        // 🔊 Jingle Delay (60s) & Mix
        '[3:a]adelay=60000|60000,aloop=loop=-1:size=2*44100,volume=5.0[jingles];' +
        '[shielded][jingles]amix=inputs=2:duration=first:weights=5 30[mixed];' +
        '[1:a][mixed]amix=inputs=2:duration=shortest:weights=2 10[out]',
        '-map', '0:v', '-map', '[out]',
        // 📉 Data Saving Settings (180k Bitrate)
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-b:v', '180k', '-maxrate', '180k', '-bufsize', '400k', 
        '-s', '640x360', '-pix_fmt', 'yuv420p', '-g', '60', 
        '-c:a', 'aac', '-b:a', '96k', '-ar', '44100', 
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => {
        // console.log(`FFmpeg: ${d}`); 
    });

    ffmpeg.on('close', (code) => {
        console.log(`Stream ended (Code: ${code}). Restarting in 3s...`);
        setTimeout(startStreaming, 3000);
    });
}

// 🚀 Start Server
app.listen(port, '0.0.0.0', () => {
    console.log(`Viru FM is live on port ${port}`);
    if (STREAM_KEY) {
        startStreaming();
    } else {
        console.log("CRITICAL ERROR: STREAM_KEY NOT FOUND!");
    }
});
