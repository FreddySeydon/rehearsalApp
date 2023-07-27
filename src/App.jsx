import React from 'react'
import "./App.css"
import Channel from './components/Channel'
import { useState, useEffect, useRef } from 'react'
import PlayPauseStop from './components/PlayPauseStop'
import { emBlock_14_01_Klavier, emBlock_14_01_Theo } from '../src/lib/sounds';

const App = () => {
  
  // Create an array of audio sources
  const sources = [
    {
      src: emBlock_14_01_Klavier.src,
      name: emBlock_14_01_Klavier.name,
    },
    {
      src: emBlock_14_01_Theo.src,
      name: emBlock_14_01_Theo.name,
    },
    {
      src: "sound3.mp3",
      name: "Sound 3",
    },
  ];

  // Create an array of refs for each audio element
  const refs = sources.map(() => useRef(null));

  // Create a state for the playing status
  const [playing, setPlaying] = useState(false);

  // Create a function to play all the audio elements
  const play = () => {
    refs.forEach((ref) => ref.current.play());
    setPlaying(true);
  };

  // Create a function to pause all the audio elements
  const pause = () => {
    refs.forEach((ref) => ref.current.pause());
    setPlaying(false);
  };

  // Create a function to stop all the audio elements
  const stop = () => {
    refs.forEach((ref) => {
      ref.current.pause();
      ref.current.currentTime = 0;
    });
    setPlaying(false);
  };

  // Use the useEffect hook to sync the playing status of all the audio elements
  useEffect(() => {
    refs.forEach((ref) => {
      ref.current.onplay = () => setPlaying(true);
      ref.current.onpause = () => setPlaying(false);
      ref.current.onended = () => setPlaying(false);
    });
  }, [refs]);

  // Render the audio mixer component
  return (
    <div className="audio-mixer">
      <h1>Audio Mixer</h1>
      <div className="controls">
        <button onClick={play} disabled={playing}>
          Play
        </button>
        <button onClick={pause} disabled={!playing}>
          Pause
        </button>
        <button onClick={stop} disabled={!playing}>
          Stop
        </button>
      </div>
      <div className="tracks">
        {sources.map((source, index) => (
          <div key={index} className="track">
            <h2>{source.name}</h2>
            <audio ref={refs[index]} src={source.src} preload="auto" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={refs[index].current?.volume || 1}
              onChange={(e) => (refs[index].current.volume = e.target.value)}
            />
            <input
              type="range"
              min="0"
              max={refs[index].current?.duration || 0}
              value={refs[index].current?.currentTime || 0}
              onChange={(e) =>
                (refs[index].current.currentTime = e.target.value)
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default App
