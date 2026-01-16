const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

// Render එකට සර්වර් එක Active කියලා පෙන්වීමට
app.get('/', (req, res) => res.send('Viru Radio PRO - Master Mode Active! 🛡️🚀'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');

    // 1. සින්දු ටික කියවීම සහ Shuffle කිරීම
    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return console.error("Songs not found in music folder!");
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting FINAL STABLE Stream (0.81MB Video Optimization)...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,                // Input 0: වීඩියෝව (0.81MB)
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.005',      // Input 1: හීනි වැස්ස
        '-f', 'concat', '-safe', '0', '-i', playlistPath,     // Input 2: ප්ලේලිස්ට් එක
        '-filter_complex', 
        // 🛠️ Audio Logic: 
        // - silenceremove: සින්දු අතර නිහඬ කොටස් ඉවත් කරයි.
        // - atempo & asetrate: Copyright Shield එක (Speed & Pitch).
        // - volume=1.8: සද්දය වැඩි කරයි.
        // - amix weights=1 10: සින්දුවට වැඩි බරක් දී වැස්ස පසුබිමට දමයි.
        '[2:a]silenceremove=stop_periods=-1:stop_duration=0.1:stop_threshold=-50dB,atempo=1.03,asetrate=44100*1.02,aresample=44100,volume=1.8[music];' +
        '[1:a][music]amix=inputs=2:duration=first:weights=1 10:dropout_transition=0[out]',
        '-map', '0:v', 
        '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-b:v', '300k',                 // වීඩියෝ Bitrate (සැහැල්ලුයි)
        '-maxrate', '300k', 
        '-bufsize', '600k', 
        '-s', '640x360',                // 360p Resolution (Stable Connection)
        '-pix_fmt', 'yuv420p', '-g', '60', 
        '-c:a', 'aac', '-b:a', '128k',  // Audio Quality (සින්දු හොඳට ඇහෙන්න)
        '-ar', '44100',
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    // Error logs බලාගැනීමට
    ffmpeg.stderr.on('data', (d) => console.log(`FFmpeg: ${d}`));
    
    ffmpeg.on('close', (code) => {
        console.log(`Stream ended. Restarting in 2 seconds...`);
        setTimeout(startStreaming, 2000);
    });
}

// සර්වර් එක පණ ගැන්වීම
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
    if (STREAM_KEY) {
        startStreaming();
    } else {
        console.log("Error: STREAM_KEY is missing!");
    }
});
