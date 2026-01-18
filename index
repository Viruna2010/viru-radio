const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - BASS BOOST & LOW NOISE ACTIVE! 🛡️🔊'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');
    const jingleFile = path.join(__dirname, 'jingle.mp3');

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting Stream: Bass Boosted, Lower Noise, Max Shield Engaged...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,
        // 🌧️ වැස්සේ සද්දේ අඩු කළා (0.03 -> 0.01)
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.01',
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath,
        '-stream_loop', '-1', '-i', jingleFile,
        '-filter_complex', 
        // 🛡️ සින්දුවේ Bass සහ Volume වැඩි කළා (1.2 -> 1.6) - Pitch Shield එක එලෙසමයි
        '[2:a]atempo=1.08,asetrate=44100*1.05,aresample=44100,volume=1.6[shielded];' +
        // 🔊 Jingle එක උඹේ පරණ විදිහටමයි
        '[3:a]adelay=60000|60000,aloop=loop=-1:size=2*44100,volume=5.0[jingles];' +
        // 🎚️ Mixing: සින්දුවයි ජින්ගල් එකයි උඹේ අගයන්ගෙන්මයි
        '[shielded][jingles]amix=inputs=2:duration=first:weights=5 30[mixed];' +
        '[1:a][mixed]amix=inputs=2:duration=shortest:weights=2 10[out]',
        '-map', '0:v', '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-b:v', '300k', '-s', '640x360', '-pix_fmt', 'yuv420p', '-g', '60', 
        '-c:a', 'aac', '-b:a', '128k', 
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => console.log(`FFmpeg: ${d}`));
    ffmpeg.on('close', () => setTimeout(startStreaming, 3000));
}

app.listen(port, '0.0.0.0', () => { if (STREAM_KEY) startStreaming(); });
