import React, { useEffect, useState, } from 'react'
import "./Channel.css"
import iconMuted from "../lib/img/muted.png"
import iconUnmuted from "../lib/img/unmuted.png"
import { Howl, Howler } from "howler";

const Channel = ({index, refs, source, globalSeek, playPressed, setPlayPressed, handleTimeUpdate, userSeek, handlePlayPause, stopPressed, isBigScreen, isTabletOrMobile, isDesktopOrLaptop, playing}) => {
const [channelVolume, setChannelVolume] = useState(0.5)
const [isMuted, setIsMuted] = useState(false)
const [isFirst, setIsFirst] = useState(false)
const [soundId, setSoundId] = useState(null)


const sliderColor = "#FFCC70"

const sound = new Howl({
  src: [source.src],
  volume: 0.5,
  autoplay: false
})

useEffect(() => {
  if(index === 0) {
    setIsFirst(true)
  }
  // sound.on('loaded', sound.stop())
}, [])
console.log(Object.keys(sound))
const playPause = () => {
  if(playing) {
    sound.pause();
  } else {
    if(!soundId){
      setSoundId(sound.play())
      console.log("SoundID:", soundId)
    } else {
      sound.play();
    }
  }
  // setPlaying(!playing)
}

useEffect(() => {
  sound.stop();
}, [stopPressed])

useEffect(() => {
  console.log(playPressed)
  if(playPressed){
    playPause()
    setPlayPressed(false)
  }
}, [playPressed])

useEffect(() => {
  isMuted ? sound.mute(true) : sound.mute(false)
}, [isMuted])

useEffect(() => {
  sound.seek(globalSeek, soundId);
}, [userSeek])

  return (
    <div key={index} className="track">
    <div className="sourceName">
    <h3>{source.name}</h3>
    </div>
    {/* <audio ref={refs[index]} src={source.src} preload="auto" muted={isMuted ? true : false} /> */}
    <input
      className='volumeSlider'
      type="range"
      min="0"
      max="1"
      step="0.01"
      orient="vertical"
      value={channelVolume}
      style={{background: sliderColor, width: isTabletOrMobile ? "0.4rem" : null}}
      // onTimeUpdate={() => handleTimeUpdate()}
      onChange={(e) => {
        sound.volume(e.target.value)
      setChannelVolume(sound.volume(soundId))}}
    />
      <div className="muteBox" style={{opacity: isFirst ? 0 : 1, display:"flex", alignItems:"center", justifyContent:"center"}}>
      {/* <p>Mute</p> */}
      {/* <img src={isMuted ? iconMuted : iconUnmuted} alt="" style={{width: "1.5rem"} } /> */}
      <button style={{backgroundColor:"transparent", padding: "0.5rem"}} onClick={() => setIsMuted(!isMuted)}><img src={isMuted ? iconMuted : iconUnmuted} alt="" style={{width: isTabletOrMobile? "2rem" : "1.5rem"} } /></button>
      {/* <input type='checkbox' onClick={() => setIsMuted(!isMuted)} /> */}
      </div>

    {/* <input
      type="range"
      min="0"
      max={refs[index].current?.duration}
      value={globalSeek}
      onChange={(e) =>
        {refs[index].current.currentTime = e.target.value
          setSeek(refs[index].current.currentTime)}
      }
    /> */}
  </div>
  )
  }

export default Channel
