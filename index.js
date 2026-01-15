const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Radio is Active!'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    
    if (!fs.existsSync(musicDir)) {
        console.error("Error: music folder not found!");
        return;
    }

    let files = fs.readdirSync(musicDir).filter(file => file.toLowerCase().endsWith('.mp3'));
    
    if (files.length === 0) {
        console.error("Error: No mp3 files found!");
        return;
    }

    files.sort(() => Math.random() - 0.5);

    // වැදගත්ම වෙනස: මෙතන සම්පූර්ණ path එක දෙනවා
    const playlist = files.map(file => `file '${path.join(musicDir, file)}'`).join('\n');
    fs.writeFileSync(path.join(__dirname, 'playlist.txt'), playlist);

    console.log(`Starting stream with ${files.length} songs...`);

    const ffmpeg = spawn('ffmpeg', [
        '-re', '-stream_loop', '-1', '-i', path.join(__dirname, 'video.mp4'),
        '-f', 'concat', '-safe', '0', '-i', path.join(__dirname, 'playlist.txt'),
        '-map', '0:v', '-map', '1:a',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-b:v', '600k',
        '-pix_fmt', 'yuv420p', '-g', '60', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (data) => console.log(`FFmpeg: ${data}`));
    ffmpeg.on('close', () => setTimeout(startStreaming, 5000));
}

app.listen(port, () => { if (STREAM_KEY) startStreaming(); });
