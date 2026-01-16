const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Beatz Radio - Master Mode Active! 📻🛡️'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4'); 

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return console.error("No songs found!");
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting MASTER STREAM (Excellent Signal Mode)...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-loop', '1', '-i', videoFile,
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.01', 
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, 
        '-filter_complex', 
        // 🛠️ Audio Guard: Copyright බේරෙන්න Pitch එක 5% වැඩිකර වැස්සේ සද්දය මික්ස් කිරීම
        '[2:a:0]asetrate=44100*1.05,aresample=44100,volume=1.5[music];' +
        '[1:a]lowpass=f=1000,volume=0.2[rain];' +
        '[music][rain]amix=inputs=2:duration=first:weights=10 1[a_vibe];' +
        // 🛠️ Visualizer Fix: කෙලින් රේඛා (Bars) පෙනෙන විදිහට සැකසීම
        '[a_vibe]showwaves=s=640x120:mode=p2p:colors=0x00FFFF@0.8,format=rgba[v_waves];' + 
        // 🛠️ CPU Optimization: 10fps දක්වා අඩු කර පින්තූරය 480p වලට scale කිරීම
        '[0:v]scale=720:480,fps=10[v_scaled];' + 
        '[v_scaled][v_waves]overlay=0:360[final_v]', 
        '-map', '[final_v]', 
        '-map', '[a_vibe]',
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
