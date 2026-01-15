const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

// සර්වර් එක ඇක්ටිව් ද කියලා බලන්න ලින්ක් එක
app.get('/', (req, res) => {
    res.send('Viru Radio is live and running!');
});

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');

    // music folder එකේ තියෙන MP3 ටික විතරක් ගන්නවා
    let files = fs.readdirSync(musicDir).filter(file => file.toLowerCase().endsWith('.mp3'));

    if (files.length === 0) {
        console.error("Error: No songs found in 'music' folder!");
        return;
    }

    // සින්දු ටික Random පිළිවෙළට සකසනවා
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(file => `file '${path.join(musicDir, file)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log(`Streaming started with ${files.length} songs...`);

    const ffmpeg = spawn('ffmpeg', [
        '-re', 
        '-stream_loop', '-1', 
        '-i', path.join(__dirname, 'video.mp4'),
        '-f', 'concat', 
        '-safe', '0', 
        '-i', playlistPath,
        '-map', '0:v', 
        '-map', '1:a',
        '-c:v', 'libx264', 
        '-preset', 'ultrafast', 
        '-tune', 'zerolatency',
        '-b:v', '250k',        // Render Free Tier එකට ගැලපෙන අඩු Bitrate එක
        '-maxrate', '250k', 
        '-bufsize', '500k', 
        '-pix_fmt', 'yuv420p', 
        '-g', '30', 
        '-c:a', 'aac', 
        '-b:a', '64k', 
        '-ar', '44100',
        '-f', 'flv', 
        `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (data) => {
        // ලොග් එක ගොඩක් පිරෙන එක නවත්තන්න frame updates විතරක් පෙන්වනවා
        const output = data.toString();
        if (output.includes('frame=')) {
            process.stdout.write(`\r${output.substring(0, 60)}`);
        } else {
            console.log(`FFmpeg Status: ${output}`);
        }
    });

    ffmpeg.on('close', (code) => {
        console.log(`Stream connection lost (Code: ${code}). Restarting in 5 seconds...`);
        setTimeout(startStreaming, 5000);
    });
}

// සර්වර් එක මුලින්ම පටන් ගන්නවා, ඊට පස්සේ තමයි ස්ට්‍රීම් එක පටන් ගන්නේ
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is listening on port ${port}`);
    if (STREAM_KEY) {
        console.log("Stream key found. Starting FFmpeg...");
        startStreaming();
    } else {
        console.error("Critical Error: STREAM_KEY is not defined in Environment Variables!");
    }
});
