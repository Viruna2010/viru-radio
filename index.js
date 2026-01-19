const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - NON-STOP MUSIC FIXED! 🛡️🔊'));

function startStreaming() {
    const musicDir = path.resolve(__dirname, 'music');
    const playlistPath = path.resolve(__dirname, 'playlist.txt');
    const videoFile = path.resolve(__dirname, 'video.mp4');

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    
    // 🚀 සින්දු ටික 10,000 පාරක් ලිස්ට් එකට දානවා. එතකොට සින්දු ඉවර වෙන්නේ නෑ.
    let longList = [];
    for (let i = 0; i < 10000; i++) {
        files.sort(() => Math.random() - 0.5); // හැම පාරම Shuffle වෙනවා
        files.forEach(f => longList.push(`file '${path.join(musicDir, f).replace(/\\/g, '/')}'`));
    }
    fs.writeFileSync(playlistPath, longList.join('\n'));

    console.log("🔄 SUPER LOOP: Playing music for eternity...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile, 
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.01',
        '-f', 'concat', '-safe', '0', '-i', playlistPath, 
        '-filter_complex', 
        '[2:a]atempo=1.07,asetrate=44100*1.06,aresample=44100,volume=1.3[shielded];' +
        // 🚀 duration=shortest දැම්මා. සින්දුවක් නැත්නම් Restart වෙන්න.
        '[1:a][shielded]amix=inputs=2:duration=shortest:weights=2 10[out]', 
        '-map', '0:v', '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-b:v', '300k', '-maxrate', '350k', '-bufsize', '600k', 
        '-r', '12', '-s', '426x240', '-pix_fmt', 'yuv420p', '-g', '24', 
        '-c:a', 'aac', '-b:a', '64k', '-ar', '44100',
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => {
        if (d.toString().includes('Opening')) {
            console.log(`🎵 Playing: ${d.toString().trim().split('/').pop()}`);
        }
    });

    ffmpeg.on('close', () => setTimeout(startStreaming, 1000));
}

app.listen(port, '0.0.0.0', () => { if (STREAM_KEY) startStreaming(); });
