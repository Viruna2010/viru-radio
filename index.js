const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - INFINITE LOOP ACTIVE! 🛡️🔊'));

function startStreaming() {
    const musicDir = path.resolve(__dirname, 'music');
    const playlistPath = path.resolve(__dirname, 'playlist.txt');
    const videoFile = path.resolve(__dirname, 'video.mp4');
    const jingleFile = path.resolve(__dirname, 'jingle.mp3');

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(f => `file '${path.join(musicDir, f).replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("🔄 STARTING INFINITE LOOP: Songs will now repeat forever...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.01',
        // 🚀 ලූප් එක හරියටම වැඩ කරන්න මේ පිළිවෙළට තියෙන්න ඕනේ:
        '-stream_loop', '-1', 
        '-f', 'concat', 
        '-safe', '0', 
        '-i', playlistPath, 
        '-stream_loop', '-1', '-i', jingleFile,
        '-filter_complex', 
        '[2:a]atempo=1.07,asetrate=44100*1.06,aresample=44100,volume=1.4[shielded];' +
        '[3:a]adelay=60000|60000,aloop=loop=-1:size=2*44100,volume=5.0[jingles];' +
        '[shielded][jingles]amix=inputs=2:duration=first:weights=5 30[mixed];' +
        '[1:a][mixed]amix=inputs=2:duration=shortest:weights=2 10[out]',
        '-map', '0:v', '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-b:v', '350k', '-maxrate', '350k', '-bufsize', '1500k', 
        '-r', '15', '-s', '426x240', '-pix_fmt', 'yuv420p', '-g', '30', 
        '-c:a', 'aac', '-b:a', '64k', '-ar', '44100',
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => {
        if (d.toString().includes('Opening')) {
            console.log(`🎵 Playing: ${d.toString().trim().split('/').pop()}`);
        }
    });

    ffmpeg.on('close', (code) => {
        console.log(`Process exited (${code}). Restarting...`);
        setTimeout(startStreaming, 3000);
    });
}

app.listen(port, '0.0.0.0', () => { if (STREAM_KEY) startStreaming(); });
