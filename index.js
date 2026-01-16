const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Radio is Active & Protected! 🛡️'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const bgShield = path.join(__dirname, 'bg_shield.mp3');
    const videoBg = path.join(__dirname, 'video.mp4');
    
    // මියුසික් ෆෝල්ඩර් එක චෙක් කිරීම
    let files = fs.readdirSync(musicDir).filter(file => file.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) {
        console.error("No songs found in music directory!");
        return;
    }

    // සින්දු Shuffle කිරීම (පිළිවෙළ මාරු කිරීම)
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(file => `file '${path.join(musicDir, file)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log(`Starting Bulletproof Stream with ${files.length} songs...`);

    const ffmpeg = spawn('ffmpeg', [
        '-re', 
        '-stream_loop', '-1', '-i', videoBg,           // Input 0: Background Video
        '-stream_loop', '-1', '-i', bgShield,          // Input 1: Rain Shield Sound
        '-f', 'concat', '-safe', '0', '-i', playlistPath, // Input 2: Music Playlist
        '-filter_complex', 
        // රොබෝව රවට්ටන Magic Filter එක: Pitch, Speed & Mixing
        '[1:a]volume=0.06[bg]; [2:a]atempo=1.06,asetrate=44100*1.03,aresample=44100[main]; [bg][main]amix=inputs=2:duration=first[out]',
        '-map', '0:v',             // වීඩියෝ එක මින් ගන්නවා
        '-map', '[out]',           // ආරක්ෂිතව හදපු ඕඩියෝ එක මින් ගන්නවා
        '-c:v', 'libx264', 
        '-preset', 'ultrafast', 
        '-b:v', '600k',
        '-pix_fmt', 'yuv420p', 
        '-g', '60', 
        '-c:a', 'aac', 
        '-b:a', '128k', 
        '-f', 'flv', 
        `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (data) => console.log(`FFmpeg Log: ${data}`));
    
    ffmpeg.on('close', (code) => {
        console.log(`Stream closed (Code: ${code}). Restarting in 5 seconds...`);
        setTimeout(startStreaming, 5000);
    });
}

app.listen(port, () => { 
    if (STREAM_KEY) {
        startStreaming(); 
    } else {
        console.error("STREAM_KEY is missing in Environment Variables!");
    }
});
