const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Beatz Radio - Ultra Light Stable Mode Active! 📻🛡️'));

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

    console.log("Starting ULTRA-LIGHT Stream (360p/15fps)...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-loop', '1', '-i', videoFile,
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.005', 
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, 
        '-filter_complex', 
        // 🛠️ CPU එක උපරිමයෙන් බේරාගැනීමට 640x360 සහ 15fps වලට සීමා කර ඇත
        '[0:v]scale=640:360,fps=15[v_scaled];' +
        '[2:a:0]showwaves=s=640x80:mode=line:colors=0x00FFFF@0.5,format=rgba[v_waves];' + 
        '[v_scaled][v_waves]overlay=0:280[final_v];' +
        '[2:a:0][1:a]amix=inputs=2:duration=first:weights=10 1[a_out]', 
        '-map', '[final_v]', 
        '-map', '[a_out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-crf', '35',                 // Compression වැඩි කර බර අඩු කිරීම
        '-b:v', '300k',               // ඉතා අඩු වීඩියෝ බිට්රේට් එකක්
        '-pix_fmt', 'yuv420p', '-g', '30', 
        '-c:a', 'aac', '-b:a', '96k', // ඕඩියෝ එක 96k වලට සෙට් කළා
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => console.log(`FFmpeg: ${d}`));
    ffmpeg.on('close', () => setTimeout(startStreaming, 3000));
}

app.listen(port, '0.0.0.0', () => {
    if (STREAM_KEY) startStreaming();
});
