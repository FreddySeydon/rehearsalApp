
export function parseLyrics(lrc) {
    console.log(lrc)
    //matching time/text lines in lrc file and storing in group "time" and "text"
    const regex = /^\[(?<time>\d{2}:\d{2}(.\d{2})?)\](?<text>.*)/;

    //lrc string to individual lines
    const lines = lrc.split("\n");

    const output = [];

    //match lines that contain time and lyrics and store an object with each line in the output variable
    lines.forEach(line => {
        const match = line.match(regex)
        if(match == null) return;

        const {time, text} = match.groups;

        output.push({
            time: parseTime(time), //parsing the time to seconds with the function below
            text: text.trim()
        });
    });

    //parse separated time to seconds
    function parseTime(time) {
        const minsec = time.split(":")
        const min = parseInt(minsec[0] * 60);
        const sec = parseFloat(minsec[1]);
    
        return min + sec;
    }
    return output;
}

export function syncLyrics(lyrics, time) {
    const scores = [];

    lyrics.forEach(lyric => {
        //get the gap between the actual time and the existing lyric time of that line
        const score = time - lyric.time;

        //only accept positive values to make sure it's the next text
        if(score >= 0) scores.push(score);
    });

    if (scores.length == 0) return null;

    //get the smallest value from scores
    const closest = Math.min(...scores);

    return scores.indexOf(closest);
}

export function formatTime(timeInSeconds) {
    if(timeInSeconds < 0){
        return '00:00'
    }
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}