import React, { useEffect, useState, } from 'react'
import "./Channel.css"
import iconMuted from "../lib/img/muted.png"
import iconUnmuted from "../lib/img/unmuted.png"

const Channel = ({index, refs, source, globalSeek, handleTimeUpdate, userSeek}) => {
const [channelVolume, setChannelVolume] = useState(1)
const [isMuted, setIsMuted] = useState(false)
const [isFirst, setIsFirst] = useState(false)

const sliderColor = "#FFCC70"

useEffect(() => {
  if(index === 0) {
    setIsFirst(true)
  }
}, [])

useEffect(() => {
  refs[index].current.currentTime = globalSeek
}, [userSeek])

  return (
    <div key={index} className="track">
    <h3>{source.name}</h3>
    <audio ref={refs[index]} src={source.src} preload="auto" muted={isMuted ? true : false} />
    <input
      className='volumeSlider'
      type="range"
      min="0"
      max="1"
      step="0.01"
      orient="vertical"
      value={channelVolume}
      style={{background: sliderColor}}
      // onTimeUpdate={() => handleTimeUpdate()}
      onChange={(e) => {
        refs[index].current.volume = e.target.value
      setChannelVolume(refs[index].current?.volume)}}
    />
      <div className="muteBox" style={{opacity: isFirst ? 0 : 1, display:"flex", alignItems:"center", justifyContent:"center"}}>
      {/* <p>Mute</p> */}
      {/* <img src={isMuted ? iconMuted : iconUnmuted} alt="" style={{width: "1.5rem"} } /> */}
      <button style={{backgroundColor:"transparent", padding: "0.5rem"}} onClick={() => setIsMuted(!isMuted)}><img src={isMuted ? iconMuted : iconUnmuted} alt="" style={{width: "1.5rem"} } /></button>
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
