
# Rehearsal App

  

The Rehearsal App is a web-based audio mixer that allows users to play, pause, stop, and seek through multiple audio tracks in sync. It also provides the ability to control volume, mute, and solo individual tracks, as well as display synchronized lyrics. The app is built using React and Tone.js.

  

## Features

  

-  **Multi-track Playback**: Play multiple audio tracks simultaneously in sync.

-  **Track Controls**: Individual controls for volume, mute, and solo for each track.

-  **Global Controls**: Play, pause, stop, and global seek for all tracks.

-  **Lyrics Display**: Synchronized lyrics display with the ability to jump to specific lyrics.

-  **Responsive Design**: Adapts to various screen sizes including desktops, tablets, and mobile devices.

  

## Components

  

### `App.jsx`

  

The main component that initializes the application and handles the global state. It fetches the sounds data and renders the `Channel` and `Lyrics` components.

  

### `Channel.jsx`

  

Manages the audio tracks and their controls. It loads tracks, handles play/pause/stop functionality, and updates the global seek position.

  

### `OneChannelControls.jsx`

  

Provides controls for individual tracks including volume adjustment, mute, and solo functionality.

  

### `Lyrics.jsx`

  

Displays the synchronized lyrics for the selected song. Allows users to jump to specific lyrics by clicking on them.

  

### `OneLine.jsx`

  

Renders a single line of lyrics and handles highlighting and scrolling to the current lyric line.

  

### CSS Files

  

-  `Channel.css`: Styles for the `Channel` and `OneChannelControls` components.

-  `Lyrics.css`: Styles for the `Lyrics` component.

  

## Installation

  

1. Clone the repository:

```bash
git clone https://github.com/yourusername/rehearsal-app.git

cd rehearsal-app
```

2. Install dependencies:
```bash
npm install
```
3. Start the development server: 
```bash
npm run dev
```

## Usage

- **Select a Song**: Use the dropdown menu to select a song.
- **Control Playback**: Use the play, pause, and stop buttons to control the playback.
- **Adjust Volume**: Use the volume sliders to adjust the volume of individual tracks.
- **Mute/Solo Tracks**: Use the mute and solo buttons to control the audio output of individual tracks.
- **Seek**: Use the global seek bar to jump to different positions in the song.
- **Lyrics**: Click on lyrics to jump to the corresponding position in the song.

## File Structure
rehearsal-app/
│
├── public/
│   ├── lrc/  # Directory for lrc files
│   ├── sounds/                # Directory for sound files and sounds.json which acts as the database for now
│
├── src/
│   ├── assets/
│   │   ├── img/               # Directory for images/icons (play, pause, stop etc.)
│   │
│   ├── components/
│   │   ├── Channel.jsx 
│   │   ├── Channel.css 
│   │   ├── Lyrics.jsx
│   │   ├── Lyrics.css
│   │   ├── OneChannelControls.jsx
│   │   └── OneLine.jsx
│   │   └── OneLine.css
│   │
│   ├── utils/
│   │   └── lrcParser.js       # Utility functions for parsing lyrics
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── index.js
│   └── index.css
│
├── .gitignore
├── package.json
├── README.md
└── yarn.lock

## Dependencies

- [React with vite](https://vitejs.dev/)
- [Tone.js](https://tonejs.github.io/)
- [react-responsive](https://www.npmjs.com/package/react-responsive)

## Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature-branch`).
3.  Make your changes.
4.  Commit your changes (`git commit -am 'Add new feature'`).
5.  Push to the branch (`git push origin feature-branch`).
6.  Create a new Pull Request.

## License
This project is licensed under the Attribution 4.0 International (CC BY 4.0) License. To view a copy of this license, visit http://creativecommons.org/licenses/by/4.0/.
