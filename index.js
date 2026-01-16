const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

// සර්වර් එක පණ තියෙනවද බලන්න
app.get('/', (req, res) => res.send('VIRU FM 24/7 - Jingle Overlay Mode Active! 🎙️🚀'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    const videoFile = path.join(__dirname, 'video.mp4');
    const jingleFile = path.join(__dirname, 'jingle.mp3'); // ජින්ගල් එක එළියේ

    // Music Folder එකේ සින්දු තියෙනවද බලනවා
    if (!fs.existsSync(musicDir)) {
        console.error("Error: 'music' folder not found!");
        return;
    }

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) {
        console.error("Error: No MP3 files found in music folder!");
        return;
    }

    // සින්දු Shuffle කරනවා
    files.sort(() => Math.random() - 0.5);

    // Playlist එක හදනවා
    const playlistContent = files.map(f => `file '${path.join(musicDir, f)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log("Starting Stream: 1-Minute Jingle Overlay Active...");

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,                 // 0: Video
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.03',       // 1: Rain Sound
        '-f', 'concat', '-safe', '0', '-stream_loop', '-1', '-i', playlistPath, // 2: Music Playlist
        '-stream_loop', '-1', '-i', jingleFile,               // 3: Jingle Overlay
        '-filter_complex', 
        // Audio Filters: Music Speed/Pitch change (Copyright) + Jingle Delay (60s)
        '[2:a]atempo=1.04,asetrate=44100*1.025,aresample=44100,volume=1.5[music];' +
        '[3:a]adelay=60000|60000,aloop=loop=-1:size=2*44100[jingles];' +
        '[music][jingles]amix=inputs=2:duration=first:weights=10 8[mixed];' +
        '[1:a][mixed]amix=inputs=2:duration=shortest:weights=3 10[out]',
        '-map', '0:v', 
        '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        '-b:v', '300k', 
        '-maxrate', '300k', 
        '-bufsize', '600k', 
        '-s', '640x360', 
        '-pix_fmt', 'yuv420p', '-g', '60', 
        '-c:a', 'aac', '-b:a', '128k', 
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    // Error Logs බලාගන්න
    ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg Log: ${data}`);
    });

    ffmpeg.on('close', (code) => {
        console.log(`Stream connection lost (Code: ${code}). Restarting in 3 seconds...`);
        setTimeout(startStreaming, 3000);
    });
}

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
    if (STREAM_KEY) {
        startStreaming();
    } else {
        console.error("Error: STREAM_KEY is missing in Environment Variables!");
    }
});
