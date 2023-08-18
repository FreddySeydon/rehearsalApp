import React from "react";
import "./App.css";
import Channel from "./components/Channel";
import { useState, useEffect, useRef } from "react";
import sounds from "./lib/sounds.json";
import { formatTime } from "../utils/lrcParser";
import Lyrics from "./components/Lyrics";
import { useMediaQuery } from "react-responsive";
import { Howl, Howler } from "howler";

import iconPlay from "./lib/img/play.png"
import iconPause from "./lib/img/pause.png"
import iconStop from "./lib/img/stop.png"

const App = () => {
  // console.log(Object.keys(Howler))
  // console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(Howler)))
  const [selectedSong, setSelectedSong] = useState("emBlock_14_01");
  const [lrcContent, setLrcContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSeek, setUserSeek] = useState(false);

  // Media Queries via react-responsive
  const isDesktopOrLaptop = useMediaQuery({query: '(min-width: 1224px)'})
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
  const isPortrait = useMediaQuery({ query: '(orientation: portrait)' })
  const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })

  // Create an array of 10 refs to keep the order of hook calls. Not all refs are being used.
  const maxTracks = 10;
  const refs = Array.from({ length: maxTracks }).map(() => useRef(null));

  // Create a state for the playing status
  const [playing, setPlaying] = useState(false);
  const [globalSeek, setGlobalSeek] = useState(0);
  // booleans to trigger the right method with the sounds in the channels
  const [pausePressed, setPausePressed] = useState(false);
  const [stopPressed, setStopPressed] = useState(false);
  const [playPressed, setPlayPressed] = useState(false);

  // const testSound = new Howl({
  //   src: sounds[selectedSong]?.tracks?[0].src
  // })
    // Play Pause function for Howler
const handlePlayPause = () => {
  setPlaying(!playing);
  setPlayPressed(!playPressed);
}

const handleStop = () => {
  setStopPressed(!stopPressed)
  setPlaying(false)
  }


// orientation sound for seek + functions
const sound = new Howl({
  src: [sounds[selectedSong]?.tracks[0]?.src],
  volume: 0.0,
  autoplay: false
})

const playPause = () => {
  if(playing) {
    sound.pause();
  } else {
    sound.play();
  }
  // setPlaying(!playing)
}

useEffect(() => {
  sound.stop();
}, [stopPressed])

useEffect(() => {
  playPause()
}, [playing])

useEffect(() => {
  sound.seek(globalSeek);
}, [userSeek])


console.log(playing)
console.log(sound.seek())
// const id1 = sound.play()

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
  const stop = (e) => {
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
      if (ref.current) {
        ref.current.onplay = () => setPlaying(true);
        ref.current.onpause = () => setPlaying(false);
        ref.current.onended = () => {
          setPlaying(false);
          setGlobalSeek(0);
        };
      }
    });
  }, [refs]);

  useEffect(() => {
    if(playing){
      handleStop();
    }
  }, [selectedSong])

  const handleTimeUpdate = () => {
    setGlobalSeek(sound.seek());
  };

  const handleSongChange = (e) => {
    setSelectedSong(e.target.value);
  }

  // Render the audio mixer component
  return (
    <div className="appWrapper" style={{padding: isTabletOrMobile ? "1rem" : "5rem"}}>
      <h1 style={{ fontSize: isTabletOrMobile ? "1.5rem" : "2rem" }}>Rehearsal App</h1>
      <div className="audio-mixer" style={{flexDirection: isTabletOrMobile ? "column" : "row"}} >
        <div className="controlsWrapper">
          <div className="tracks">
            {sounds[selectedSong]?.tracks?.map((source, index) => (
              <div key={index} className="singleTrack">
                <Channel
                  key={index}
                  source={source}
                  index={index}
                  refs={refs}
                  globalSeek={globalSeek}
                  handleTimeUpdate={handleTimeUpdate}
                  userSeek={userSeek}
                  selectedSong={selectedSong}
                  isBigScreen={isBigScreen}
                  isDesktopOrLaptop={isDesktopOrLaptop}
                  isTabletOrMobile={isTabletOrMobile}
                  handlePlayPause={handlePlayPause}
                  stopPressed={stopPressed}
                  playing={playing}
                  playPressed={playPressed}
                  setPlayPressed={setPlayPressed}
                />
              </div>
            ))}
          </div>
          <div className="selectBox">
            <select
              value={selectedSong}
              onChange={(e) => {handleSongChange(e)}}
              onClick={handleStop}
              style={{minWidth: "10rem", minHeight: "2.5rem", textAlign:"center", fontSize:"1.2rem", fontWeight:"bold"}}
            >
              {Object.keys(sounds).map((key) => (
                <option key={key} value={key}>
                  {sounds[key].songname}
                </option>
              ))}
            </select>
          </div>
          <div className="controls">
            <button style={{marginRight:"0.25rem", marginLeft:"0.25rem", backgroundColor:"transparent"}} onClick={handlePlayPause} >
              <img style={{width:"3rem"}} src={sound.playing() ? iconPause : iconPlay} alt="Play Button" />
            </button>
            <button style={{marginRight:"0.25rem", marginLeft:"0.25rem", backgroundColor:"transparent"}} onClick={handleStop} disabled={!sound.playing()}>
            <img style={{width:"3rem", opacity: sound.playing() ? 1 : 0.5}} src={iconStop} alt="Stop Button" />
            </button>
          </div>
          <div className="globalSeek">
            <input
              type="range"
              min="0"
              max={sound.duration() || 0}
              value={globalSeek}
              onChange={(e) => {
                setGlobalSeek(e.target.value);
              }}
              onInput={() => setUserSeek(!userSeek)}
            />
            <div>{formatTime(globalSeek)}</div>
          </div>
          {/* <div className="refAudio">
            <audio
              ref={refs[0]}
              src={sounds[selectedSong]?.tracks[0]?.src}
              onTimeUpdate={handleTimeUpdate}
            ></audio>
          </div> */}
        </div>
        <div className="lyrics">
          <Lyrics
            sounds={sounds}
            setLrcContent={setLrcContent}
            lrcContent={lrcContent}
            setLoading={setLoading}
            loading={loading}
            globalSeek={globalSeek}
            selectedSong={selectedSong}
            setGlobalSeek={setGlobalSeek}
            setUserSeek={setUserSeek}
            userSeek={userSeek}
            isBigScreen={isBigScreen}
            isDesktopOrLaptop={isDesktopOrLaptop}
            isTabletOrMobile={isTabletOrMobile}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
