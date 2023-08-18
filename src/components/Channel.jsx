import React, { useEffect, useState, } from 'react'
import "./Channel.css"
import iconMuted from "../lib/img/muted.png"
import iconUnmuted from "../lib/img/unmuted.png"
import { Howl, Howler } from "howler";
import OneChannelControls from './OneChannelControls';

const Channel = ({refs, sources, globalSeek, playPressed, setPlayPressed, handleTimeUpdate, userSeek, handlePlayPause, stopPressed, isBigScreen, isTabletOrMobile, isDesktopOrLaptop, playing}) => {
const [channelVolume, setChannelVolume] = useState(0.5)
const [isMuted, setIsMuted] = useState(false)
const [isFirst, setIsFirst] = useState(false)
const [soundIds, setSoundIds] = useState(null)
const [sourcePaths, setSourcePaths] = useState([])


const sliderColor = "#FFCC70"
sources.map((track) => {
  setSourcePaths((prev) => [...prev, track.src])
})

const sound = new Howl({
  src: [sourcePaths],
  volume: 0.5,
  autoplay: false
})

// useEffect(() => {
//   if(index === 0) {
//     setIsFirst(true)
//   }
//   sound.on('loaded', sound.stop())
// }, [])

const getIds = () => {
  sourcePaths.forEach((id) => {setSoundIds((prev) => [...prev, id])})
}

const playPause = () => {
  if(playing) {
    sound.pause();
  } else {
      sound.play();
    }
  }
  // setPlaying(!playing)

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
    <div className="trackControls">
      <OneChannelControls sound={sound} isMuted={isMuted} setIsMuted={setIsMuted} soundIds={soundIds} />
    </div>

  )
  }

export default Channel
