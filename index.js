const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Beatz Radio - High Speed No-Lag Active! 🛡️🚀'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4'); 

    // 1. ප්ලේලිස්ට් එක සෑදීම
    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return console.error("No songs found!");
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting NO-LAG Optimized Stream...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-loop', '1', '-i', videoFile,
        // 🌧️ වැස්සේ සද්දය (Rain Noise)
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.03', 
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, 
        '-filter_complex', 
        // 🛡️ Audio Guard: Pitch + Speed (1.05x) සහ වැස්සේ සද්දය මික්ස් කිරීම
        '[2:a:0]asetrate=44100*1.05,aresample=44100,volume=1.2[m_audio];' +
        '[1:a]lowpass=f=1200,volume=0.9[r_audio];' + 
        '[m_audio][r_audio]amix=inputs=2:duration=first:weights=10 1[a_out];' +
        // 🚀 Video Fix: CPU එකට බර දෙන Visualizers අයින් කර පින්තූරය 480p/10fps කළා
        '[0:v]scale=854:480,fps=10[v_out]', 
        '-map', '[v_out]', 
        '-map', '[a_out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-crf', '32',
        '-b:v', '450k', 
        '-pix_fmt', 'yuv420p', '-g', '20', 
        '-c:a', 'aac', '-b:a', '128k', 
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => console.log(`FFmpeg: ${d}`));
    ffmpeg.on('close', () => setTimeout(startStreaming, 3000));
}

app.listen(port, '0.0.0.0', () => {
    if (STREAM_KEY) startStreaming();
});
