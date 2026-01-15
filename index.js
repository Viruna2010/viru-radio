const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 10000;
const STREAM_KEY = process.env.STREAM_KEY;

app.get('/', (req, res) => res.send('Viru Radio is Active and Optimized!'));

function startStreaming() {
    const musicDir = path.join(__dirname, 'music');
    const playlistPath = path.join(__dirname, 'playlist.txt');
    
    // MP3 ෆයිල් ටික විතරක් තෝරාගන්නවා
    let files = fs.readdirSync(musicDir).filter(file => file.toLowerCase().endsWith('.mp3'));
    
    if (files.length === 0) {
        console.error("No songs found in music folder!");
        return;
    }

    // සින්දු ටික Random විදියට ප්ලේ වෙන්න හදනවා
    files.sort(() => Math.random() - 0.5);

    const playlistContent = files.map(file => `file '${path.join(musicDir, file)}'`).join('\n');
    fs.writeFileSync(playlistPath, playlistContent);

    console.log(`Starting optimized stream with ${files.length} songs...`);

    const ffmpeg = spawn('ffmpeg', [
        '-re', 
        '-stream_loop', '-1', 
        '-i', path.join(__dirname, 'video.mp4'),
        '-f', 'concat', 
        '-safe', '0', 
        '-i', playlistPath,
        '-map', '0:v', 
        '-map', '1:a',
        '-c:v', 'libx264', 
        '-preset', 'ultrafast', 
        '-tune', 'zerolatency',
        '-b:v', '250k',        // වීඩියෝ Bitrate එක අඩු කළා Buffering නවත්තන්න
        '-maxrate', '250k', 
        '-bufsize', '500k', 
        '-pix_fmt', 'yuv420p', 
        '-g', '30',            // Keyframes ලයිව් ස්ට්‍රීම් වලට ගැලපෙන්න හැදුවා
        '-c:a', 'aac', 
        '-b:a', '64k',         // ඕඩියෝ Bitrate එකත් Optimized කළා
        '-ar', '44100',
        '-f', 'flv', 
        `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        // ලොග් එක ගොඩක් පිරෙන එක නවත්තන්න ප්‍රධාන දේවල් විතරක් පෙන්වනවා
        if (output.includes('frame=')) {
            process.stdout.write(`\r${output.substring(0, 60)}`);
        } else {
            console.log(`FFmpeg: ${output}`);
        }
    });

    ffmpeg.on('close', (code) => {
        console.log(`Stream stopped (Code: ${code}). Restarting in 5 seconds...`);
        setTimeout(startStreaming, 5000);
    });
}

// සර්වර් එක පටන් ගන්නවා
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (STREAM_KEY) {
        startStreaming();
    } else {
        console.error("ERROR: STREAM_KEY is missing in Environment Variables!");
    }
});
