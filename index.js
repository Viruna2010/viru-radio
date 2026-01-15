const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Radio Lag Fix Active!'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    let files = fs.readdirSync(musicDir).filter(file => file.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return;
    
    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(file => `file '${path.join(musicDir, file)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    const ffmpeg = spawn('ffmpeg', [
        '-re', '-stream_loop', '-1', '-i', path.join(__dirname, 'video.mp4'),
        '-f', 'concat', '-safe', '0', '-i', playlistPath,
        '-map', '0:v:0', '-map', '1:a:0',
        '-c:v', 'libx264', 
        '-preset', 'ultrafast', 
        '-tune', 'zerolatency',
        '-r', '20',             // FPS එක 20 ට බස්සුවා (සර්වර් එකට ලේසියි)
        '-b:v', '120k',        // Bitrate එක උපරිමයටම අඩු කළා
        '-maxrate', '120k', 
        '-bufsize', '240k', 
        '-pix_fmt', 'yuv420p', 
        '-g', '40',            // Keyframe interval එක හරියටම සෙට් කළා
        '-c:a', 'aac', 
        '-b:a', '48k',         // Audio එක 48k කළා (Data ඉතිරි කරන්න)
        '-ar', '44100',
        '-f', 'flv', 
        `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        if (!output.includes('frame=')) console.log(`FFmpeg: ${output}`);
    });

    ffmpeg.on('close', () => setTimeout(startStreaming, 2000));
}

app.listen(port, () => {
    if (STREAM_KEY) startStreaming();
});
