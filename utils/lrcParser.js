export function parseLyrics(lrc) {
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