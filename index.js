const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Radio is Active and Fixed!'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    
    // MP3 ටික විතරක් ලිස්ට් එකට ගන්නවා
    let files = fs.readdirSync(musicDir).filter(file => file.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) {
        console.log("No MP3 files found in music folder!");
        return;
    }
    
    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(file => `file '${path.join(musicDir, file)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log(`Starting stream with ${files.length} songs...`);

    const ffmpeg = spawn('ffmpeg', [
        '-re', 
        '-stream_loop', '-1', 
        '-i', path.join(__dirname, 'video.mp4'), // Input 0
        '-f', 'concat', 
        '-safe', '0', 
        '-i', playlistPath, // Input 1
        '-map', '0:v:0', // අනිවාර්යයෙන්ම video.mp4 එකේ වීඩියෝ එක විතරක් ගනින්
        '-map', '1:a:0', // අනිවාර්යයෙන්ම playlist එකේ ඕඩියෝ එක විතරක් ගනින්
        '-c:v', 'libx264', 
        '-preset', 'ultrafast', 
        '-tune', 'zerolatency',
        '-b:v', '300k', 
        '-maxrate', '300k', 
        '-bufsize', '600k',
        '-pix_fmt', 'yuv420p', 
        '-g', '60',
        '-c:a', 'aac', 
        '-b:a', '128k', 
        '-ar', '44100',
        '-f', 'flv', 
        `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        // Frame updates විතරක් පෙන්වනවා ලොග් එක පිරෙන එක නවත්තන්න
        if (output.includes('frame=')) {
            process.stdout.write(`\r${output.substring(0, 60)}`);
        } else {
            console.log(`FFmpeg Status: ${output}`);
        }
    });

    ffmpeg.on('close', (code) => {
        console.log(`Stream stopped (Code: ${code}). Restarting in 5 seconds...`);
        setTimeout(startStreaming, 5000);
    });
}

app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
    if (STREAM_KEY) {
        startStreaming();
    } else {
        console.error("STREAM_KEY not found in Environment Variables!");
    }
});
