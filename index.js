const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Beatz Radio - Final Fix Live! 📻🛡️'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4'); 

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return console.error("No songs found!");
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting FINAL STABLE stream...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-loop', '1', '-i', videoFile,
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.03', 
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, 
        '-filter_complex', 
        // 🛠️ Simple Flow: Audio Mix -> Visualizer -> Overlay
        '[2:a:0]asetrate=44100*1.05,aresample=44100,volume=1.2[m_audio];' +
        '[1:a]lowpass=f=1200,volume=0.9[r_audio];' + 
        '[m_audio][r_audio]amix=inputs=2:duration=first:weights=6 3[audio_out];' +
        '[audio_out]showwaves=s=640x120:mode=p2p:colors=0x00FFFF@0.8,format=rgba[wave_v];' + 
        '[0:v]scale=720:480,fps=10[bg_v];' + 
        '[bg_v][wave_v]overlay=0:360[final_v]', 
        '-map', '[final_v]', 
        '-map', '[audio_out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-crf', '32', '-b:v', '400k', 
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
