const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Radio PRO - High Pitch & Heavy Rain Active! 🌧️📻'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return console.error("Songs not found!");
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting Stream (Pitch: 1.05x | Rain: High Volume)...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,
        // 🌧️ වැස්සේ සද්දය (Volume එක වැඩි කර ඇත)
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.08', 
        '-f', 'concat', '-safe', '0', '-i', playlistPath,
        '-filter_complex', 
        // Audio Logic: Pitch 1.05x + High Rain Volume Mix
        '[2:a]silenceremove=stop_periods=-1:stop_duration=0.1:stop_threshold=-50dB,asetrate=44100*1.05,aresample=44100[m_tuned];' +
        '[1:a]lowpass=f=1000,volume=1.8[r_heavy];' + 
        '[m_tuned][r_heavy]amix=inputs=2:duration=first:weights=10 4[a_out];' +
        // Video Fix: 480p/10fps (CPU Friendly)
        '[0:v]scale=854:480,fps=10[v_out]',
        '-map', '[v_out]', 
        '-map', '[a_out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-crf', '32', '-b:v', '450k', 
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
