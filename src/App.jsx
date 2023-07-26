import React from 'react'
import "./App.css"
import Channel from './components/Channel'
import { useState, useEffect } from 'react'
import PlayPauseStop from './components/PlayPauseStop'
import { emBlock_14_01_Klavier } from '../src/lib/sounds';

const App = () => {
  const [sounds, setSounds] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  // const [isLoading, setIsLoading] = useState(true);
  // useEffect(() => {
  //   if(sounds !== [""])
  // })
  
  useEffect(() => {
    setSounds([emBlock_14_01_Klavier]);
  }, [])

  const handlePlaying = () => {
    setIsPlaying(!isPlaying);
    setIsPaused(!isPaused);
  }
  const handlePause = () => {
    setIsPaused(!isPaused);
    setIsPlaying(!isPlaying);
  }

return(
  <div>
    <div>
    <h2>There should be something here:</h2> 
    {!sounds ? (<div>Loading</div>) : (
    <div>
      {console.log(sounds)}
      {sounds.map((sound) => {
        const soundSrc = sound.src;
        const soundId = sound.id;
        const soundName = sound.name;
        // console.log("Sound Name: ", soundName.toString())
        console.log("SoundName type:", typeof(soundName))
        return(
          <Channel key={soundId} soundSrc={soundSrc} soundName={soundName} isPlaying={isPlaying} isPaused={isPaused}/>
        )
      })}
    </div>

    )}       
        <PlayPauseStop handlePlaying={handlePlaying} isPlaying={isPlaying} handlePause={handlePause}/> 
        </div>
    </div>
)
}

export default App
