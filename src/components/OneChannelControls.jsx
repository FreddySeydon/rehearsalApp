import React from "react";
import { useState, useEffect } from "react";
import iconMuted from "../lib/img/muted.png"
import iconUnmuted from "../lib/img/unmuted.png"
import "./Channel.css"

const OneChannelControls = ({track, players, sound, soundIds, id, index, sources, isTabletOrMobile}) => {

  const [channelVolume, setChannelVolume] = useState(0);
  const [isFirst, setIsFirst] = useState();
  const [isMuted, setIsMuted] = useState(false);
  console.log("OneCahnnel: ", sources)

  useEffect(() => {
  if(index === 0) {
    setIsFirst(true)
  }
}, [])

const handleMute = () => {
  if(!isMuted){
    sound.mute(true, id);
    setIsMuted(true);
  } else {
    sound.mute(false, id)
    setIsMuted(false);
  }
}

  return (
    <div style={{display: "flex"}}>
      <div key={index} className="track">
        <div className="sourceName">
          <h3>{sources[index].name}</h3>
        </div>
        {/* <audio ref={refs[index]} src={source.src} preload="auto" muted={isMuted ? true : false} /> */}
        <input
          className="volumeSlider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          orient="vertical"
          value={channelVolume}
          style={{
            width: isTabletOrMobile ? "0.4rem" : null,
          }}
          // onTimeUpdate={() => handleTimeUpdate()}
          onChange={(e) => {
            sound.volume(e.target.value, id);
            setChannelVolume(sound.volume(id));
          }}
        />
        <div
          className="muteBox"
          style={{
            opacity: isFirst ? 0 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* <p>Mute</p> */}
          {/* <img src={isMuted ? iconMuted : iconUnmuted} alt="" style={{width: "1.5rem"} } /> */}
          <button
            style={{ backgroundColor: "transparent", padding: "0.5rem" }}
            onClick={handleMute}
          >
            <img
              src={isMuted ? iconMuted : iconUnmuted}
              alt=""
              style={{ width: isTabletOrMobile ? "2rem" : "1.5rem" }}
            />
          </button>
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
    </div>
  );
};

export default OneChannelControls;
