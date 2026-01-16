const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Beatz Radio - Max Speed Mode ⚡'));

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

    console.log("Starting MAX SPEED Optimized Stream...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-loop', '1', '-i', videoFile,
        // 🌧️ වැස්සේ සද්දය (Rain Noise)
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.03', 
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, 
        '-filter_complex', 
        // 🛡️ Audio Guard: Pitch + Speed (1.05x) සහ වැස්සේ සද්දය
        '[2:a:0]asetrate=44100*1.05,aresample=44100,volume=1.2[m_audio];' +
        '[1:a]lowpass=f=1200,volume=0.9[r_audio];' + 
        '[m_audio][r_audio]amix=inputs=2:duration=first:weights=10 1[a_out];' +
        // 🚀 Video Fix: 480p/10fps (Server Load = 0%)
        '[0:v]scale=854:480,fps=10[v_out]', 
        '-map', '[v_out]', 
        '-map', '[a_out]',
        // 🔥 Ultra-Fast Encoding Settings
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-threads', '0',  // CPU එකේ උපරිම බලය ගන්නවා
        '-crf', '30',     // Quality එක පොඩ්ඩක් අඩු කරලා Speed එක වැඩි කරනවා
        '-b:v', '400k', 
        '-maxrate', '450k', 
        '-bufsize', '1200k', // Buffer එක වැඩි කළාම ලයිව් එක හිර වෙන්නේ නෑ
        '-pix_fmt', 'yuv420p', '-g', '20', 
        '-c:a', 'aac', '-b:a', '96k', // Audio bitrate එක පොඩ්ඩක් අඩු කළා (Speed එකට හොඳයි)
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => console.log(`FFmpeg: ${d}`));
    ffmpeg.on('close', () => setTimeout(startStreaming, 3000));
}

app.listen(port, '0.0.0.0', () => {
    if (STREAM_KEY) startStreaming();
});
