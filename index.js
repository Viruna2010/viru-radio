const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Beatz Radio - Beat Mode is LIVE! 🌧️📻🥁'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4'); 

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return console.error("No songs found!");
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting BEAT-SYNC Stream (Excellent Signal)...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-loop', '1', '-i', videoFile,
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.03', 
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, 
        '-filter_complex', 
        // 1. Audio: 1.05x Speed + Pitch Guard + Rain Mix
        '[2:a:0]asetrate=44100*1.05,aresample=44100,volume=1.2[m_vibe];' +
        '[1:a]lowpass=f=1200,volume=0.9[r_vibe];' + 
        '[m_vibe][r_vibe]amix=inputs=2:duration=first:weights=6 3[audio_out];' +
        // 2. Visualizer: සින්දුවේ Beat එකට යන Vertical Bars (p2p mode)
        '[audio_out]showwaves=s=640x120:mode=p2p:colors=0x00FFFF@0.8,format=rgba[v_beat_bars];' + 
        // 3. Video: CPU Risk 0 (Excellent Signal)
        '[0:v]scale=720:480,fps=10[v_bg];' + 
        '[v_bg][v_beat_bars]overlay=0:360[v_final]', 
        '-map', '[v_final]', 
        '-map', '[audio_out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-crf', '32',
        '-b:v', '400k', 
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
