const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Radio PRO - Heavy Shield Active! 🛡️🌧️'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');

    // සින්දු ටික කියවීම සහ Shuffle කිරීම
    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return console.error("Songs not found!");
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting ULTRA SHIELD Stream (Auto-generated Noise)...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,
        // සවුත්තු MP3 එක වෙනුවට වැස්සේ සද්දය (White Noise) සජීවීව නිපදවන කොටස
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:amp=0.03', 
        '-f', 'concat', '-safe', '0', '-i', playlistPath,
        '-filter_complex', 
        // ආරක්ෂාව: සින්දුවේ Speed (1.06), Pitch (1.03) සහ වැස්සේ සද්දය මික්ස් කිරීම
        '[2:a]atempo=1.06,asetrate=44100*1.03,aresample=44100[main]; [1:a][main]amix=inputs=2:duration=first[out]',
        '-map', '0:v', '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-b:v', '500k', 
        '-pix_fmt', 'yuv420p', '-g', '60', '-c:a', 'aac', '-b:a', '128k',
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => console.log(`FFmpeg: ${d}`));
    ffmpeg.on('close', () => {
        console.log("Stream closed. Restarting in 2 seconds...");
        setTimeout(startStreaming, 2000);
    });
}

app.listen(port, '0.0.0.0', () => { if (STREAM_KEY) startStreaming(); });
