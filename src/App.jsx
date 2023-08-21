import React from "react";
import "./App.css";
import Channel from "./components/Channel";
import { useState, useEffect, useRef } from "react";
import sounds from "./lib/sounds.json";
import { formatTime } from "../utils/lrcParser";
import Lyrics from "./components/Lyrics";
import { useMediaQuery } from "react-responsive";

import iconPlay from "./lib/img/play.png"
import iconPause from "./lib/img/pause.png"
import iconStop from "./lib/img/stop.png"
import { format } from "path";

const App = () => {
  // console.log(Object.keys(Howler))
  // console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(Howler)))
  const [selectedSong, setSelectedSong] = useState("emBlock_14_01");
  const [lrcContent, setLrcContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSeek, setUserSeek] = useState(false);
  const [trackDuration, setTrackDuration] = useState(0);
  const [statePlayers, setStatePlayers] = useState(null)

  // Media Queries via react-responsive
  const isDesktopOrLaptop = useMediaQuery({query: '(min-width: 1224px)'})
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
  const isPortrait = useMediaQuery({ query: '(orientation: portrait)' })
  const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })


  // Create a state for the playing status
  const [playing, setPlaying] = useState(false);
  const [globalSeek, setGlobalSeek] = useState(0);



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
            
              <div className="singleTrack">
                <Channel
                  sources={sounds[selectedSong]?.tracks}
                  refs={refs}
                  globalSeek={globalSeek}
                  setGlobalSeek={setGlobalSeek}
                  handleTimeUpdate={handleTimeUpdate}
                  userSeek={userSeek}
                  selectedSong={selectedSong}
                  setSelectedSong={setSelectedSong}
                  isBigScreen={isBigScreen}
                  isDesktopOrLaptop={isDesktopOrLaptop}
                  isTabletOrMobile={isTabletOrMobile}
                  handlePlayPause={handlePlayPause}
                  stopPressed={stopPressed}
                  playing={playing}
                  playPressed={playPressed}
                  setPlayPressed={setPlayPressed}
                  setTrackDuration={setTrackDuration}
                  trackDuration={trackDuration}
                  statePlayers={statePlayers}
                  setStatePlayers={setStatePlayers}
                  formatTime={formatTime}
                />
              </div>

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
