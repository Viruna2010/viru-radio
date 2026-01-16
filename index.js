const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Radio PRO - Active! 🛡️'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const bgShield = path.join(__dirname, 'bg_shield.mp3');
    const videoFile = path.join(__dirname, 'video.mp4');

    // සින්දු ටික කියවීම සහ Shuffle කිරීම
    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return console.error("Songs not found!");
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting Live Shield Stream...");

    // Render Free Plan එකට ගැළපෙන Low-CPU FFmpeg Command එක
    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,
        '-stream_loop', '-1', '-i', bgShield,
        '-f', 'concat', '-safe', '0', '-i', playlistPath,
        '-filter_complex', 
        '[1:a]volume=0.05[bg]; [2:a]atempo=1.06,asetrate=44100*1.03,aresample=44100[main]; [bg][main]amix=inputs=2:duration=first[out]',
        '-map', '0:v', '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-b:v', '500k', 
        '-pix_fmt', 'yuv420p', '-g', '60', '-c:a', 'aac', '-b:a', '128k',
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => console.log(`FFmpeg: ${d}`));
    
    ffmpeg.on('close', () => {
        console.log("Restarting in 2 seconds...");
        setTimeout(startStreaming, 2000); // ඉක්මනින් රීස්ටාර්ට් වීම
    });
}

app.listen(port, () => { if (STREAM_KEY) startStreaming(); });
