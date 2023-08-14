import React, { useEffect, useCallback, useState, } from 'react'
import {Howl} from "howler"

const Channel = ({index, refs, source, globalSeek, handleTimeUpdate, userSeek}) => {
const [channelVolume, setChannelVolume] = useState(refs[index].current?.volume)
const [seek, setSeek] = useState(refs[index].current?.currentTime)
useEffect(() => {
  refs[index].current.currentTime = globalSeek
}, [userSeek])
// console.log(refs)
  return (
    <div key={index} className="track">
    <h2>{source.name}</h2>
    <audio ref={refs[index]} src={source.src} preload="auto" />
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={channelVolume}
      onChange={(e) => (refs[index].current.volume = e.target.value)}
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
