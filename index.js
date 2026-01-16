const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

// සර්වර් එක Active බව පෙන්වීමට
app.get('/', (req, res) => res.send('Viru Radio PRO - Super Shield & Infinite Loop Active! 🛡️🚀'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');

    // 1. සින්දු කියවීම සහ Shuffle කිරීම
    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return console.error("Songs not found in music folder!");
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting ZERO-RISK PROTECTED Stream (Infinite Loop Active)...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,                // Input 0: වීඩියෝව (දිගටම ලූප් වේ)
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.03',      // Input 1: Copyright වලට වැස්සේ සද්දය
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, // Input 2: සින්දු ප්ලේලිස්ට් එක (දිගටම ලූප් වේ)
        '-filter_complex', 
        // 🛡️ SUPER SHIELD LOGIC:
        // - atempo=1.04: සින්දුව 4%ක් වේගවත් වේ
        // - asetrate=44100*1.025: පිච් එක 2.5%ක් වෙනස් වේ
        // - firequalizer: සින්දුවේ ඩිජිටල් සලකුණ වෙනස් කර Content ID මඟහරියි
        '[2:a]silenceremove=stop_periods=-1:stop_duration=0.1:stop_threshold=-50dB,' +
        'atempo=1.04,asetrate=44100*1.025,aresample=44100,' +
        'firequalizer=gain_entry=\'entry(0,0);entry(100,2);entry(1000,0);entry(4000,2);entry(16000,0)\',' +
        'volume=1.8[music];' +
        // amix logic: duration=shortest මගින් වැස්ස සහ සින්දු නූලටම මික්ස් කරයි
        '[1:a][music]amix=inputs=2:duration=shortest:weights=4 10:dropout_transition=0[out]',
        '-map', '0:v', 
        '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-b:v', '350k',                  // Excellent Signal එකට සැහැල්ලු Bitrate
        '-maxrate', '350k', 
        '-bufsize', '700k', 
        '-s', '640x360',                 // 360p (Render Server එකට සැහැල්ලුයි)
        '-pix_fmt', 'yuv420p', '-g', '20', 
        '-c:a', 'aac', '-b:a', '128k', 
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    // Logs බලාගැනීමට
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
