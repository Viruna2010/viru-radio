const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - NO JINGLE | MAXIMUM SHIELD ACTIVE! 🛡️🔊'));

function startStreaming() {
    const musicDir = path.resolve(__dirname, 'music');
    const playlistPath = path.resolve(__dirname, 'playlist.txt');
    const videoFile = path.resolve(__dirname, 'video.mp4');

    // ප්ලේලිස්ට් එක හදනවා සහ සින්දු ටික Shuffle කරනවා
    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    files.sort(() => Math.random() - 0.5);
    const playlistContent = files.map(f => `file '${path.join(musicDir, f).replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("🚀 STARTING VIRU FM: Jingle Removed | Pitch 1.06 | Speed 1.07");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile, // Background Video Loop
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.01', // Rain/White Noise Shield
        '-stream_loop', '-1', '-f', 'concat', '-safe', '0', '-i', playlistPath, // Music Playlist Loop
        '-filter_complex', 
        // [2:a] කියන්නේ ප්ලේලිස්ට් එක. ඒකේ Speed (1.07) සහ Pitch (1.06) වෙනස් කරනවා.
        '[2:a]atempo=1.07,asetrate=44100*1.06,aresample=44100,volume=1.3[shielded];' +
        // වැස්ස සද්දෙයි (1:a) සින්දුවයි (shielded) එකට මික්ස් කරනවා.
        '[1:a][shielded]amix=inputs=2:duration=shortest:weights=2 10[out]',
        '-map', '0:v', '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-b:v', '300k', '-maxrate', '350k', '-bufsize', '600k', 
        '-r', '12', '-s', '426x240', '-pix_fmt', 'yuv420p', '-g', '24', 
        '-c:a', 'aac', '-b:a', '64k', '-ar', '44100',
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    // මොන සින්දුවද ප්ලේ වෙන්නේ කියලා ලොග් එකේ පෙන්වනවා
    ffmpeg.stderr.on('data', (d) => {
        if (d.toString().includes('Opening')) {
            const fileName = d.toString().trim().split('/').pop();
            console.log(`🎵 Playing Now: ${fileName}`);
        }
    });

    // මොනවා හරි හේතුවකට නතර වුණොත් තත්පරයකින් ආයේ පටන් ගන්නවා
    ffmpeg.on('close', (code) => {
        console.log(`Stream exited (code ${code}). Restarting in 1s...`);
        setTimeout(startStreaming, 1000);
    });
}

// සර්වර් එක ස්ටාර්ට් කිරීම
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
    if (STREAM_KEY) {
        startStreaming();
    } else {
        console.error("❌ ERROR: STREAM_KEY is missing in Environment Variables!");
    }
});
