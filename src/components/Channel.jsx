import React, { useEffect, useState, useRef} from 'react'
import "./Channel.css"
import * as Tone from 'tone'
import OneChannelControls from './OneChannelControls';

const Channel = ({ formatTime, statePlayers, setStatePlayers, setTrackDuration, trackDuration, selectedSong, setSelectedSong, setUserSeek, setGlobalSeek, sources, globalSeek, playPressed, setPlayPressed, selectedSong, handleTimeUpdate, userSeek, stopPressed, isBigScreen, isTabletOrMobile, isDesktopOrLaptop, playing}) => {
const [channelVolume, setChannelVolume] = useState(0.5)
const [isMuted, setIsMuted] = useState(false)
const [isFirst, setIsFirst] = useState(false)
const [soundIds, setSoundIds] = useState(null)
const [sourcePaths, setSourcePaths] = useState([])

// const soundRef = useRef(null)


  useEffect(() => {
    const players = new Tone.Players().toDestination();
    loadTracks(players);

    return () => {
        players.dispose();
    }


}, [selectedSong])

const loadTracks = (players) => {
  if(players._players.size === 0) {
    console.log("Adding Players")
    sources.map((track, index) => {
      players.add(`${index}`, track.src)
      if(index===0){
        players.player(`${index}`).buffer.onload = () => setTrackDuration(players.player(`${index}`).buffer.duration)
      }
      players.player(`${index}`).sync().start(0)
    });
    setStatePlayers(players);
  }
}

const handleGlobalSeek = (value) => {
  if(Tone.Transport.state === "started"){
      Tone.Transport.pause()
      Object.values(statePlayers._players).forEach(player => player.sync());
      setGlobalSeek(value)
      Tone.Transport.seconds = value
      Tone.Transport.start()
  } else {
      Object.values(statePlayers._players).forEach(player => player.sync());
      setGlobalSeek(value)
      Tone.Transport.seconds = value
  }
}

const handlePlay = () => {
  // await Tone.start()
  const interval = setInterval(() => {
      // console.log(Tone.Transport.seconds);
      setGlobalSeek(Tone.Transport.seconds)
  }, 10)
  Tone.Transport.start();
}

const handlePlayPause = async () => {
  if(Tone.Transport.state === "started"){
    handlePause()
  } else {
    await Tone.start()
    handlePlay() 
  }
}
const handlePause = () => {
  Tone.Transport.pause();
}
const handleStop = () => {
  Tone.Transport.stop();
  setGlobalSeek(0);
}


// const handleSongChange = (e) => {
//   setSelectedSong(e.target.value);
// }



  return (
    <div className="trackControls" style={{display:'flex'}}>
      {!isLoading ? <div>Loading...</div> : sources.map((track, index) => {
        return <OneChannelControls key={index} players={statePlayers} track={track} index={index} sources={sources} isTabletOrMobile={isTabletOrMobile} isDesktopOrLaptop={isDesktopOrLaptop}/>

      })}
      <div className="globalControls">
      <div className="controls">
            <button style={{marginRight:"0.25rem", marginLeft:"0.25rem", backgroundColor:"transparent"}} onClick={handlePlayPause} >
              <img style={{width:"3rem"}} src={playing ? iconPause : iconPlay} alt="Play Button" />
            </button>
            <button style={{marginRight:"0.25rem", marginLeft:"0.25rem", backgroundColor:"transparent"}} onClick={handleStop} disabled={!sound.playing()}>
            <img style={{width:"3rem", opacity: Tone.Transport.state ? 1 : 0.5}} src={iconStop} alt="Stop Button" />
            </button>
          </div>
          <div className="globalSeek">
            <input
              type="range"
              min="0"
              max={trackDuration || 0}
              value={Tone.Transport.seconds}
              onChange={(e) => {
                handleGlobalSeek(e.target.value);
              }}
              onInput={() => setUserSeek(!userSeek)}
            />
            <div>{formatTime(globalSeek)}</div>
          </div>
      </div>
    </div>

  )
  }

export default Channel
