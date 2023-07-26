import React, { useEffect, useCallback } from 'react'
import {Howl} from "howler"

const Channel = ({soundSrc, soundName, isPlaying, isPaused}) => {
const DEFAULT_VOLUME = 0.8;
const sound = new Howl({
            src: [soundSrc],
            html5: true, 
        });
// console.log("SOUND: ", sound);
const playPause = useCallback(() => {
    isPlaying ? sound.play() : sound.pause();
}, [isPlaying])

useEffect(() => {
    console.log("IS PLAYING: ", isPlaying)
    playPause()
}, [isPlaying])


// isPaused ? sound.pause() : null;
// useEffect(() => {
//     if(isPlaying) {
//         sound.play();
//     } else {sound.pause();}
// }, [isPlaying])

  return (
    <div>
        <h2>{soundName}</h2>
        <button onClick={() => {sound.play()}}>Play {soundName}</button>
        <button onClick={() => {sound.pause()}}>Pause {soundName}</button>
        <div>-------------Slider ---------</div>
    </div>
  )
  }

export default Channel
