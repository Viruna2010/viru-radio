const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

// සර්වර් එක චෙක් කරන්න
app.get('/', (req, res) => res.send('Viru Radio is live and the image error is fixed!'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    
    // music ෆෝල්ඩර් එකේ තියෙන MP3 විතරක් ගන්නවා
    let files = fs.readdirSync(musicDir).filter(file => file.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) {
        console.error("No songs found!");
        return;
    }
    
    // සින්දු ටික Random පිළිවෙළට සකසනවා
    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(file => `file '${path.join(musicDir, file)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log(`Streaming started with ${files.length} songs. (MP3 Image errors ignored)`);

    const ffmpeg = spawn('ffmpeg', [
        '-re', 
        '-stream_loop', '-1', 
        '-i', path.join(__dirname, 'video.mp4'),
        '-f', 'concat', 
        '-safe', '0', 
        '-vn', // වැදගත්ම දේ: සින්දුවල ඇතුළේ තියෙන පින්තූර (MP3 album art) අයින් කරනවා
        '-i', playlistPath, 
        '-map', '0:v', 
        '-map', '1:a',
        '-c:v', 'libx264', 
        '-preset', 'ultrafast', 
        '-tune', 'zerolatency',
        '-b:v', '250k', 
        '-maxrate', '250k', 
        '-bufsize', '500k',
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
        if (output.includes('frame=')) {
            process.stdout.write(`\r${output.substring(0, 60)}`);
        } else {
            console.log(`FFmpeg: ${output}`);
        }
    });

    ffmpeg.on('close', (code) => {
        console.log(`Stream stopped. Restarting... Code: ${code}`);
        setTimeout(startStreaming, 5000);
    });
}

app.listen(port, '0.0.0.0', () => {
    console.log(`Server started on port ${port}`);
    if (STREAM_KEY) startStreaming();
});
