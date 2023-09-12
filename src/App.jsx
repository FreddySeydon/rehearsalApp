import React, { useEffect } from "react";
import "./App.css";
import Channel from "./components/Channel";
import { useState } from "react";
// import sounds from "./lib/sounds.json";
import { formatTime } from "../utils/lrcParser";
import Lyrics from "./components/Lyrics";
import { useMediaQuery } from "react-responsive";
import loadingSpinner from "./assets/img/loading.gif"

const App = () => {

  const [selectedSong, setSelectedSong] = useState(JSON.parse(localStorage.getItem('selected-song')) || "blabla_12");
  const [lrcContent, setLrcContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSeek, setUserSeek] = useState(false);
  const [trackDuration, setTrackDuration] = useState(0);
  const [statePlayers, setStatePlayers] = useState(null)
  const [stateSolos, setStateSolos] = useState(null)
  const [isStopped, setIsStopped] = useState(true)
  const [playersLoaded, setPlayersLoaded] = useState(false)
  const [clearMute, setClearMute] = useState(false)
  const [sounds, setSounds] = useState(null)

  // Media Queries via react-responsive
  const isDesktopOrLaptop = useMediaQuery({query: '(min-width: 1224px)'})
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
  const isPortrait = useMediaQuery({ query: '(orientation: portrait)' })
  const isRetina = useMediaQuery({ query: '(min-resolution: 2dppx)' })

  // Create a state for the playing status
  const [playing, setPlaying] = useState(false);
  const [globalSeek, setGlobalSeek] = useState(0);
  const [seekUpdateInterval, setSeekUpdateInterval] = useState(null)

  useEffect(() => {
    const fetchSounds = async () => {      
      try {
        const response = await fetch("sounds/sounds.json")
        const sounds = await response.json()
        setSounds(sounds)
      } catch (error) {
        console.log(error)
      }
    }
    fetchSounds()
  }, [])

  // Render the audio mixer component
  return (
    <>
    {!sounds ? <div><img src={loadingSpinner} alt="" width={"5rem"}/></div> :
    <div className="appWrapper" style={{padding: isTabletOrMobile ? "1rem" : "5rem"}}>
      <h1 style={{ fontSize: isTabletOrMobile ? "1.5rem" : "2rem" }}>Rehearsal App</h1>
      <div className="audio-mixer" style={{flexDirection: isTabletOrMobile ? "column" : "row"}} >
        <div className="controlsWrapper">
          <div className="tracks">
            
              <div className="singleTrack">
                <Channel
                  sources={sounds[selectedSong]?.tracks}
                  globalSeek={globalSeek}
                  setGlobalSeek={setGlobalSeek}
                  userSeek={userSeek}
                  selectedSong={selectedSong}
                  setSelectedSong={setSelectedSong}
                  isBigScreen={isBigScreen}
                  isDesktopOrLaptop={isDesktopOrLaptop}
                  isTabletOrMobile={isTabletOrMobile}
                  playing={playing}
                  setPlaying={setPlaying}
                  setTrackDuration={setTrackDuration}
                  trackDuration={trackDuration}
                  statePlayers={statePlayers}
                  setStatePlayers={setStatePlayers}
                  stateSolos={stateSolos}
                  setStateSolos={setStateSolos}
                  formatTime={formatTime}
                  setLoading={setLoading}
                  loading={loading}
                  sounds={sounds}
                  isStopped={isStopped}
                  setIsStopped={setIsStopped}
                  setSeekUpdateInterval={setSeekUpdateInterval}
                  seekUpdateInterval={seekUpdateInterval}
                  playersLoaded={playersLoaded}
                  setPlayersLoaded={setPlayersLoaded}
                  clearMute={clearMute}
                  setClearMute={setClearMute}
                />
              </div>

          </div>
          <div className="selectBox">
           
          </div>

        </div>
        <div className="lyrics">
          <Lyrics
            sounds={sounds}
            statePlayers={statePlayers}
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
    </div>}
    </>
  );
};

export default App;
