import React, { useEffect, useState, } from 'react'
import "./Channel.css"

const Channel = ({index, refs, source, globalSeek, handleTimeUpdate, userSeek}) => {
const [channelVolume, setChannelVolume] = useState(1)
const [seek, setSeek] = useState(refs[index]?.current?.currentTime)
useEffect(() => {
  refs[index].current.currentTime = globalSeek
}, [userSeek])
// console.log(source.src)
  return (
    <div key={index} className="track">
    <h3>{source.name}</h3>
    <audio ref={refs[index]} src={source.src} preload="auto" />
    <input
      className='volumeSlider'
      type="range"
      min="0"
      max="1"
      step="0.01"
      orient="vertical"
      value={channelVolume}
      onChange={(e) => {
        refs[index].current.volume = e.target.value
      setChannelVolume(refs[index].current?.volume)}}
    />
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
