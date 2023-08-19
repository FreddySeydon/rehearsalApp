import React, { useEffect, useState, useRef} from 'react'
import "./Channel.css"
import { Howl, Howler } from "howler";
import OneChannelControls from './OneChannelControls';

const Channel = ({refs, setTrackDuration, setGlobalSeek, sources, globalSeek, playPressed, setPlayPressed, selectedSong, handleTimeUpdate, userSeek, handlePlayPause, stopPressed, isBigScreen, isTabletOrMobile, isDesktopOrLaptop, playing}) => {
const [channelVolume, setChannelVolume] = useState(0.5)
const [isMuted, setIsMuted] = useState(false)
const [isFirst, setIsFirst] = useState(false)
const [soundIds, setSoundIds] = useState(null)
const [sourcePaths, setSourcePaths] = useState([])

const soundRef = useRef(null)

const sliderColor = "#FFCC70"
// console.log("sourcepaths",sourcePaths)
console.log("Channel sources: ", sources)

// useEffect(() => {
//   console.log("Why is this not running?")
//   sources.map((track) => {
//     setSourcePaths((prev) => [...prev, track.src])
//   })
// }, [])


// useEffect(() =>{
//   console.log("SOURCEPATHS:", sourcePaths)
// }, [sourcePaths])

console.log("Length of sourcePaths",sourcePaths.length)
useEffect(() => {
  const paths = sources.map((track) => {
    return track.src
  })
  soundRef.current = new Howl({
    src: [...paths],
    volume: 0.5,
    autoplay: false
  })
  setSourcePaths(paths)
}, [selectedSong])

// console.log(soundRef.current)

// const stopAllTracks = () => {
//   soundIds.forEach((id) => {
//     console.log("HowlID:", id);
//     soundRef.current.stop(id);
//   })
// }

// const getIds = () => {
//   sourcePaths.map(() => {
//     console.log(soundRef.current.play())
//     setSoundIds((prev) => [...prev, soundRef.current.play()])
//   })

//   if(soundIds.length === sourcePaths.length){
//     stopAllTracks();
//   }
// }
useEffect(() => {
console.log("sound1", soundRef.current.play())
console.log("sound2", soundRef.current.play())
console.log("sound3", soundRef.current.play())
console.log("sound4", soundRef.current.play())
// console.log("sound5", soundRef.current.play())
// console.log("sound6", soundRef.current.play())
}, [])
const getIds = () => {
  const ids = sourcePaths.map(src => {
    const id =soundRef.current.play();
    soundRef.current.pause(id);
    return id;
  })
  setSoundIds(ids);
  console.log("IDS",  ids)
}

useEffect(() => {
  console.log("SoundIDs Array: ", soundIds)
}, [soundIds])

useEffect(() => {
  if(sourcePaths.length){
    getIds();
  }
}, [sourcePaths])



const playPause = () => {
  if(playing) {
    soundRef.current.pause();
  } else {
      soundRef.current.play();
    }
  }

useEffect(() => {
  soundRef.current.stop();
  setGlobalSeek(0)
}, [stopPressed])

useEffect(() => {
  console.log(playPressed)
  if(playPressed){
    playPause()
    setPlayPressed(false)
  }
}, [playPressed])

// useEffect(() => {
//   isMuted ? soundRef.current.mute(true) : soundRef.current.mute(false)
// }, [isMuted])

useEffect(() => {
  soundRef.current.seek(globalSeek);
}, [userSeek])

  return (
    <div className="trackControls" style={{display:'flex'}}>
      {!soundIds ? <div>Loading...</div> : soundIds.map((id, index) => {
        return <OneChannelControls key={index} index={index} sound={soundRef.current} soundIds={soundIds} id={id} sources={sources} isTabletOrMobile={isTabletOrMobile} isDesktopOrLaptop={isDesktopOrLaptop}/>

      })}
    </div>

  )
  }

export default Channel
