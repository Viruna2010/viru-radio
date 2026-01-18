const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - 100GB SAFE MODE + LIVE LOGS 🛡️🔊'));

function startStreaming() {
    const musicDir = path.resolve(__dirname, 'music');
    const playlistPath = path.resolve(__dirname, 'playlist.txt');
    const videoFile = path.resolve(__dirname, 'video.mp4');
    const jingleFile = path.resolve(__dirname, 'jingle.mp3');

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(f => `file '${path.join(musicDir, f).replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log(`========================================`);
    console.log(`LIVE START: ${files.length} Songs Loaded`);
    console.log(`========================================`);

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
        '-b:v', '250k',        // Video Bitrate (Data Saving)
        '-maxrate', '250k', 
        '-bufsize', '500k', 
        '-s', '640x360', 
        '-pix_fmt', 'yuv420p', 
        '-g', '60',            // YouTube වලට අනිවාර්යයි
        '-c:a', 'aac', '-b:a', '64k', '-ar', '44100', // Audio Bitrate (Data Saving)
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    // 🖥️ මේකෙන් තමයි ලොග්ස් වල Speed එක සහ ප්ලේ වෙන සින්දුව පෙන්වන්නේ
    ffmpeg.stderr.on('data', (data) => {
        const logMsg = data.toString();
        
        // ප්ලේ වෙන සින්දුව පෙන්වන්න
        if (logMsg.includes('Opening')) {
            const songName = logMsg.match(/music\/(.+?\.mp3)/);
            if (songName) console.log(`🎵 Playing: ${songName[1]}`);
        }
        
        // ස්ට්‍රීම් එකේ Speed එක සහ Bitrate එක හැම තත්පර 10කට සැරයක් පෙන්වන්න
        if (logMsg.includes('fps=')) {
            const stats = logMsg.match(/fps=.*?bitrate=.*?speed=.*?x/);
            if (stats) console.log(`📊 Stats: ${stats[0]}`);
        }
    });

    ffmpeg.on('close', (code) => {
        console.log(`Stream Restarting... (Code: ${code})`);
        setTimeout(startStreaming, 3000);
    });
}

app.listen(port, '0.0.0.0', () => { if (STREAM_KEY) startStreaming(); });
