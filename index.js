const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - ULTIMATE STABLE MODE ACTIVE! 🛡️🔊'));

function startStreaming() {
    const musicDir = path.resolve(__dirname, 'music');
    const playlistPath = path.resolve(__dirname, 'playlist.txt');
    const videoFile = path.resolve(__dirname, 'video.mp4');
    const jingleFile = path.resolve(__dirname, 'jingle.mp3');

    // ෆෝල්ඩර් එක තියෙනවද කියලා චෙක් කරනවා
    if (!fs.existsSync(musicDir)) {
        console.log("CRITICAL ERROR: 'music' folder not found!");
        return;
    }

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    
    console.log(`========================================`);
    console.log(`TOTAL SONGS DISCOVERED: ${files.length}`);
    files.forEach(f => console.log(`-> Found: ${f}`));
    console.log(`========================================`);

    if (files.length === 0) {
        console.log("ERROR: No songs found in music folder!");
        setTimeout(startStreaming, 10000);
        return;
    }

    // Shuffle songs
    files.sort(() => Math.random() - 0.5);

    // ✅ ප්ලේලිස්ට් එකේ Paths හරියටම හදනවා (Fix for specialized environments)
    const playlistContent = files.map(f => {
        const fullPath = path.join(musicDir, f).replace(/\\/g, '/');
        return `file '${fullPath}'`;
    }).join('\n');
    
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting Stream: Fixed Pathing & Buffer Management...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile, 
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.01', 
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, 
        '-stream_loop', '-1', '-i', jingleFile, 
        '-filter_complex', 
        '[2:a]aresample=44100,atempo=1.08,asetrate=44100*1.05,volume=1.6[shielded];' +
        '[3:a]adelay=60000|60000,aloop=loop=-1:size=2*44100,volume=5.0[jingles];' +
        '[shielded][jingles]amix=inputs=2:duration=first:weights=5 30[mixed];' +
        '[1:a][mixed]amix=inputs=2:duration=shortest:weights=2 10[out]',
        '-map', '0:v', '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-b:v', '200k', '-maxrate', '200k', '-bufsize', '400k', 
        '-s', '640x360', '-pix_fmt', 'yuv420p', '-g', '60', 
        '-c:a', 'aac', '-b:a', '96k', '-ar', '44100', 
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => {
        const msg = d.toString();
        // වැදගත් errors විතරක් ලොග් කරනවා
        if (msg.includes('Error') || msg.includes('Impossible')) {
            console.log(`FFmpeg Alert: ${msg}`);
        }
    });

    ffmpeg.on('close', (code) => {
        console.log(`Stream ended (Code: ${code}). Restarting in 3s...`);
        setTimeout(startStreaming, 3000);
    });
}

app.listen(port, '0.0.0.0', () => {
    console.log(`Server Active on Port ${port}`);
    if (STREAM_KEY) startStreaming();
});
