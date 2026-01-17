const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - 24/7 STABLE MODE! 🛡️🔊'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');
    const jingleFile = path.join(__dirname, 'jingle.mp3');

    if (!fs.existsSync(musicDir)) {
        console.log("CRITICAL ERROR: 'music' folder not found!");
        return;
    }

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    
    console.log(`========================================`);
    console.log(`TOTAL SONGS FOUND: ${files.length}`);
    console.log(`========================================`);

    if (files.length === 0) {
        console.log("ERROR: No songs to play!");
        setTimeout(startStreaming, 10000);
        return;
    }

    files.sort(() => Math.random() - 0.5);

    // ✅ මෙන්න මෙතන තමයි වැදගත්ම වෙනස! 
    // සින්දුවේ නම ඇතුළේ තනි උද්ධෘත ලකුණු (single quotes) තිබුණත් වැඩ කරන විදිහට හැදුවා.
    const playlistContent = files.map(f => {
        const filePath = path.join(musicDir, f).replace(/'/g, "'\\''");
        return `file '${filePath}'`;
    }).join('\n');
    
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting Lifetime Stream with Fix for Spaces/Symbols...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile, 
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.01', 
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, 
        '-stream_loop', '-1', '-i', jingleFile, 
        '-filter_complex', 
        '[2:a]atempo=1.08,asetrate=44100*1.05,aresample=44100,volume=1.6[shielded];' +
        '[3:a]adelay=60000|60000,aloop=loop=-1:size=2*44100,volume=5.0[jingles];' +
        '[shielded][jingles]amix=inputs=2:duration=first:weights=5 30[mixed];' +
        '[1:a][mixed]amix=inputs=2:duration=shortest:weights=2 10[out]',
        '-map', '0:v', '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-b:v', '180k', '-maxrate', '180k', '-bufsize', '400k', 
        '-s', '640x360', '-pix_fmt', 'yuv420p', '-g', '60', 
        '-c:a', 'aac', '-b:a', '96k', '-ar', '44100', 
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.on('close', (code) => {
        console.log(`Stream ended (Code: ${code}). Restarting in 3s...`);
        setTimeout(startStreaming, 3000);
    });
}

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    if (STREAM_KEY) startStreaming();
});
