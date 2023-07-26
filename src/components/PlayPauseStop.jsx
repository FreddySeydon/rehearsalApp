import React, { useEffect } from 'react'

const PlayPauseStop = ({isPlaying, isPaused, handlePlaying, handlePause}) => {
    useEffect(() => {
        console.log(isPlaying);
    }, [isPlaying])
  return (
    <div>
      <button onClick={() => {handlePlaying()}}>{!isPlaying ? "Play" : "Pause"}</button>
      <button onClick={()=> {handlePause()}}>Pause</button>
      <button>Stop</button>
    </div>
  )
}

export default PlayPauseStop
