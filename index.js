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
    
    // music folder එක ඇතුළේ mp3 තියෙනවද බලනවා
    if (!fs.existsSync(musicDir)) {
        console.error("Error: music folder not found!");
        return;
    }

    let files = fs.readdirSync(musicDir).filter(file => file.toLowerCase().endsWith('.mp3'));
    
    if (files.length === 0) {
        console.error("Error: No mp3 files found in music folder!");
        return;
    }

    // සින්දු ටික Shuffle කරනවා
    files.sort(() => Math.random() - 0.5);

    // Render එකට ගැලපෙන විදියට playlist එක හදනවා
    const playlist = files.map(file => `file 'music/${file}'`).join('\n');
    fs.writeFileSync('playlist.txt', playlist);

    console.log(`Starting stream with ${files.length} songs...`);

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', 
        '-i', 'video.mp4',
        '-f', 'concat', 
        '-safe', '0', 
        '-i', 'playlist.txt',
        '-map', '0:v', 
        '-map', '1:a',
        '-c:v', 'libx264', 
        '-preset', 'ultrafast', 
        '-b:v', '600k',
        '-pix_fmt', 'yuv420p', 
        '-g', '60',
        '-c:a', 'aac', 
        '-b:a', '128k', 
        '-ar', '44100',
        '-f', 'flv', 
        `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg: ${data}`);
    });

    ffmpeg.on('close', (code) => {
        console.log(`FFmpeg process exited with code ${code}. Restarting...`);
        setTimeout(startStreaming, 5000);
    });
}

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
    if (STREAM_KEY) {
        startStreaming();
    } else {
        console.error("Error: STREAM_KEY is missing in Environment Variables!");
    }
});
