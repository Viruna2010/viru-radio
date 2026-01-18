const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - HIGH STABILITY MODE ACTIVE! 🛡️🔊'));

function startStreaming() {
    const musicDir = path.resolve(__dirname, 'music');
    const playlistPath = path.resolve(__dirname, 'playlist.txt');
    const videoFile = path.resolve(__dirname, 'video.mp4');
    const jingleFile = path.resolve(__dirname, 'jingle.mp3');

    if (!fs.existsSync(musicDir)) return;

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(f => {
        const fullPath = path.join(musicDir, f).replace(/\\/g, '/');
        return `file '${fullPath}'`;
    }).join('\n');
    
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting Stream: High Bitrate for YouTube Compliance...");

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
        // 🚀 YouTube එකට ගැලපෙන විදිහට Bitrate වැඩි කළා
        '-c:v', 'libx264', 
        '-preset', 'veryfast', 
        '-tune', 'zerolatency',
        '-b:v', '1000k',       // 1Mbps Video (Preparing හිරවෙන එක නවත්තන්න)
        '-maxrate', '1000k', 
        '-bufsize', '2000k', 
        '-s', '854x480',      // Standard 480p
        '-pix_fmt', 'yuv420p', 
        '-g', '60',           // Keyframe interval (Very important for YouTube)
        '-c:a', 'aac', 
        '-b:a', '128k', 
        '-ar', '44100', 
        '-f', 'flv', 
        `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => {
        if (d.toString().includes('Error')) console.log(`FFmpeg: ${d}`);
    });

    ffmpeg.on('close', () => setTimeout(startStreaming, 3000));
}

app.listen(port, '0.0.0.0', () => {
    if (STREAM_KEY) startStreaming();
});
