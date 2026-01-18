const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('VIRU FM - 80GB ULTRA SAFE MODE! 🛡️🔊'));

function startStreaming() {
    const musicDir = path.resolve(__dirname, 'music');
    const playlistPath = path.resolve(__dirname, 'playlist.txt');
    const videoFile = path.resolve(__dirname, 'video.mp4');
    const jingleFile = path.resolve(__dirname, 'jingle.mp3');

    let files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    files.sort(() => Math.random() - 0.5);
    
    const playlistContent = files.map(f => `file '${path.join(musicDir, f).replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log(`🚀 80GB TARGET MODE START: ${files.length} songs.`);

    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-stream_loop', '-1', '-i', videoFile,
        // 🌧️ වැහි සද්දේ අඩු කළා (a=0.01)
        '-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.01',
        '-f', 'concat', '-safe', '0', '-i', playlistPath,
        '-stream_loop', '-1', '-i', jingleFile,
        '-filter_complex', 
        // 🛡️ සින්දුවේ Pitch එක තව චුට්ටක් වෙනස් කළා (Risk 0 කරන්න)
        '[2:a]atempo=1.07,asetrate=44100*1.06,aresample=44100,volume=1.4[shielded];' +
        '[3:a]adelay=60000|60000,aloop=loop=-1:size=2*44100,volume=5.0[jingles];' +
        '[shielded][jingles]amix=inputs=2:duration=first:weights=5 30[mixed];' +
        '[1:a][mixed]amix=inputs=2:duration=shortest:weights=1 10[out]',
        '-map', '0:v', '-map', '[out]',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', 
        // 📉 80GB Target Settings (Total ~280kbps)
        '-b:v', '200k',        // වීඩියෝ එක 200k කළා (පට්ට විදිහට ඩේටා ඉතුරුයි)
        '-maxrate', '200k', 
        '-bufsize', '400k', 
        '-s', '426x240',       // 240p වලට බැස්සුවා (ඩේටා බේරගන්න හොඳම විදිහ)
        '-pix_fmt', 'yuv420p', 
        '-g', '60', 
        '-c:a', 'aac', '-b:a', '64k', '-ar', '44100', // ඕඩියෝ එක 64k (Streaming වලට ඇති)
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    let lastStats = "";
    ffmpeg.stderr.on('data', (d) => {
        const msg = d.toString();
        if (msg.includes('fps=')) {
            const match = msg.match(/fps=.*?bitrate=.*?speed=.*?x/);
            if (match) lastStats = match[0];
        }
        if (msg.includes('Opening')) {
            const songName = msg.trim().split('/').pop();
            console.log(`🎵 PLAYING: ${songName} | 📊 ${lastStats}`);
        }
    });

    ffmpeg.on('close', (code) => {
        console.log(`Restarting... (${code})`);
        setTimeout(startStreaming, 3000);
    });
}

app.listen(port, '0.0.0.0', () => { if (STREAM_KEY) startStreaming(); });
