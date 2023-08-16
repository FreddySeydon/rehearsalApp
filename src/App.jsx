import React from 'react'
import "./App.css"
import Channel from './components/Channel'
import { useState, useEffect, useRef } from 'react'
import sounds from "./lib/sounds.json";
import { formatTime } from '../utils/lrcParser'
import Lyrics from './components/Lyrics'

const App = () => {
  
  const [selectedSong, setSelectedSong] = useState("emBlock_14_01")
  const [lrcFile, setLrcFile] = useState(null)
  const [lrcContent, setLrcContent] = useState(null)
  const [loading, setLoading] = useState(true);
  const [userSeek, setUserSeek] = useState(false);

  // Create an array of refs for each audio element
  const refs = sounds[selectedSong]?.tracks?.map(() => useRef(null));

  // console.log("REFS: ", refs)

  // Create a state for the playing status
  const [playing, setPlaying] = useState(false);
  const [stopped, setStopped] = useState(true);
  const [globalSeek, setGlobalSeek] = useState(0);

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
    setGlobalSeek(0);
    setPlaying(false);
  };


  // Use the useEffect hook to sync the playing status of all the audio elements
  useEffect(() => {
    refs.forEach((ref) => {
      ref.current.onplay = () => setPlaying(true);
      ref.current.onpause = () => setPlaying(false);
      ref.current.onended = () => {
        setPlaying(false);
        setGlobalSeek(0);
        };
    });
  }, [refs]);

  const handleTimeUpdate = () => {
    setGlobalSeek(refs[0]?.current?.currentTime)
  }

  // Render the audio mixer component
  return (
    <div>
      <h1 style={{fontSize:"2rem"}}>Rehearsal App</h1>
    <div className="audio-mixer">
      <div className="controlsWrapper">
      <div className="tracks">
        {sounds[selectedSong]?.tracks?.map((source, index) => (
          <div key={index} className='singleTrack'>
          <Channel key={index} source={source} index={index} refs={refs} globalSeek={globalSeek} handleTimeUpdate={handleTimeUpdate} userSeek={userSeek} selectedSong={selectedSong}/> 
          </div>
        ))}
      </div>
      <div className="selectBox">
      <select value={selectedSong} onChange={(e) => setSelectedSong(e.target.value)}>
        {Object.keys(sounds).map(key => (
        <option key={key} value={key}>
            {sounds[key].songname}
        </option>
        ))}
      </select>
      </div>
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
      <div className="globalSeek">
      <input
      type="range"
      min="0"
      max={refs[0].current?.duration || 0}
      value={globalSeek}
      onChange={(e) =>
        {setGlobalSeek(e.target.value)}
      }
      onInput={() => setUserSeek(!userSeek)}
    />
    <div>{formatTime(globalSeek)}</div>
    </div>
    <div className='refAudio'>
      <audio
      ref={refs[0]}
      src={sounds[selectedSong]?.tracks[0]?.src}
      onTimeUpdate={handleTimeUpdate}>
      </audio>
    </div>
      </div>
      <div className="lyrics">
        <Lyrics sounds={sounds} setLrcContent={setLrcContent} lrcContent={lrcContent} setLoading={setLoading} loading={loading} globalSeek={globalSeek} selectedSong={selectedSong} setGlobalSeek={setGlobalSeek} setUserSeek={setUserSeek} userSeek={userSeek}/>
        
      </div>
    </div>
    </div>
  );
};

export default App
