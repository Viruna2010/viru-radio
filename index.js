const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

// Render එකට සර්වර් එක Active කියලා පෙන්වීමට
app.get('/', (req, res) => res.send('Viru Radio PRO - No Gap & Zero Risk Active! 🛡️🚀'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');

    // සින්දු ටික කියවීම සහ Shuffle කිරීම
    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return console.error("Songs not found in music folder!");
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting NO-GAP & PROTECTED Stream (Noise: 0.02)...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,               // Input 0: වීඩියෝව
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.02',      // Input 1: සජීවී වැසි සද්දය
        '-f', 'concat', '-safe', '0', '-i', playlistPath,    // Input 2: ප්ලේලිස්ට් එක
        '-filter_complex', 
        // silenceremove: සින්දු අතර නිහඬ කොටස් කපා ඉවත් කර Gap එක නැති කරයි
        // atempo=1.03 & asetrate=1.02: ආරක්ෂිත ශීල්ඩ් එක ක්‍රියාත්මක කරයි
        '[2:a]silenceremove=stop_periods=-1:stop_duration=0.1:stop_threshold=-50dB,atempo=1.03,asetrate=44100*1.02,aresample=44100[music]; [1:a][music]amix=inputs=2:duration=first:dropout_transition=0[out]',
        '-map', '0:v', 
        '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-b:v', '500k', 
        '-pix_fmt', 'yuv420p', '-g', '60', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => console.log(`FFmpeg: ${d}`));
    
    ffmpeg.on('close', (code) => {
        console.log(`Stream ended. Restarting in 2 seconds...`);
        setTimeout(startStreaming, 2000);
    });
}

// Port Binding සහ සර්වර් එක පණ ගැන්වීම
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
    if (STREAM_KEY) {
        startStreaming();
    } else {
        console.log("Error: STREAM_KEY is missing in Environment Variables!");
    }
});
