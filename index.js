const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - LOGGING MODE ACTIVE! 🛡️🔊'));

function startStreaming() {
    const musicDir = path.resolve(__dirname, 'music');
    const playlistPath = path.resolve(__dirname, 'playlist.txt');
    const videoFile = path.resolve(__dirname, 'video.mp4');
    const jingleFile = path.resolve(__dirname, 'jingle.mp3');

    if (!fs.existsSync(musicDir)) {
        console.log("ERROR: Music directory not found!");
        return;
    }

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    
    console.log(`========================================`);
    console.log(`TOTAL SONGS DISCOVERED: ${files.length}`);
    files.forEach(f => console.log(`-> Found: ${f}`));
    console.log(`========================================`);

    if (files.length === 0) {
        console.log("ERROR: No MP3 files found in music folder!");
        setTimeout(startStreaming, 5000);
        return;
    }

    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(f => `file '${path.join(musicDir, f).replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("INITIATING FFMPEG STREAM...");

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
        '-b:v', '500k', '-maxrate', '500k', '-bufsize', '1000k', 
        '-s', '640x360', '-pix_fmt', 'yuv420p', '-g', '60', // Keyframes set to 60 for YouTube
        '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    // 🖥️ මේකෙන් තමයි FFmpeg ඇතුළේ වෙන හැමදේම ලොග්ස් වල පෙන්වන්නේ
    ffmpeg.stderr.on('data', (data) => {
        const msg = data.toString();
        // ගොඩක් වැදගත් ඒකක් හෝ Error එකක් නම් විතරක් පෙන්වන්න
        if (msg.includes('Error') || msg.includes('Impossible') || msg.includes('Opening')) {
            console.log(`FFmpeg Alert: ${msg.trim()}`);
        }
    });

    ffmpeg.on('close', (code) => {
        console.log(`Stream ended (Code: ${code}). Restarting in 3s...`);
        setTimeout(startStreaming, 3000);
    });
}

app.listen(port, '0.0.0.0', () => {
    console.log(`Viru FM Web Server Active on Port ${port}`);
    if (STREAM_KEY) startStreaming();
});
