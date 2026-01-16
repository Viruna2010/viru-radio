const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Beatz Radio - Zero Risk Active! 📻🛡️'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4'); 

    // 1. සින්දු ටික සෙට් කිරීම (Playlist logic)
    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) return console.error("Songs not found!");
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting FINAL STABLE Stream...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-loop', '1', '-i', videoFile, // Background Image
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.005', // වැස්සේ සද්දය
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, // Music Loop
        '-filter_complex', 
        // Audio processing: මෙතැනදී තමයි සින්දුවට Visualizer එක සෙට් වෙන්නේ
        '[2:a]volume=1.8[music];' +
        // Pulse Effect: පින්තූරයේ දීප්තිය ලාවට නිවී නිවී පත්තුවීම
        '[0:v]hue=b=\'0.5*sin(2*PI*t/5)+0.5\':s=1[v_pulse];' +
        // Visualizer: සින්දුවට අනුව හෙල්ලෙන Cyan පාට රේඛා
        '[music]showwaves=s=1280x120:mode=line:colors=0x00FFFF@0.6,format=rgba[v_waves];' + 
        // Overlay: Visualizer එක පින්තූරයේ යටින්ම තැබීම
        '[v_pulse][v_waves]overlay=x=0:y=ih-120[final_v];' +
        '[music][1:a]amix=inputs=2:duration=first:weights=10 1[a_out]', 
        '-map', '[final_v]', 
        '-map', '[a_out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-crf', '30',                 // CPU එක උපරිමයෙන් බේරාගැනීමට
        '-b:v', '800k',               // සිග්නල් පර්ෆෙක්ට් වෙන්න අවශ්‍ය බිට්රේට් එක
        '-maxrate', '800k',
        '-bufsize', '1600k',
        '-pix_fmt', 'yuv420p', '-g', '60', 
        '-c:a', 'aac', '-b:a', '128k', 
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (d) => console.log(`FFmpeg: ${d}`));
    ffmpeg.on('close', () => setTimeout(startStreaming, 2000));
}

app.listen(port, '0.0.0.0', () => {
    if (STREAM_KEY) startStreaming();
});
