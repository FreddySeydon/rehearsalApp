function parseLyrics(lrc) {
    //separating time from lyrics
    const regex = /^\[(?<time>\d{2}:\d{2}(.\d{2})?)\](?<text>.*)/;

    //lrc string to individual lines
    const lines = lrc.split("\n");

    const output = [];

    lines.forEach(line => {
        const match = line.match(regex)
    })
}