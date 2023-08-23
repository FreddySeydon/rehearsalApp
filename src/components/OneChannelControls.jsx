import React from "react";
import { useState, useEffect } from "react";
import iconMuted from "../assets/img/muted.png"
import iconUnmuted from "../assets/img/unmuted.png"
import "./Channel.css"

const OneChannelControls = ({ statePlayers, players, index, sources, isTabletOrMobile, track}) => {

  const [channelVolume, setChannelVolume] = useState(-10);
  const [isMuted, setIsMuted] = useState(false);

const handleVolumeChange = (value) => {
  players.player(`${index}`).volume.value = value
  setChannelVolume(value)
}

const handleMute = () => {
    players.player(`${index}`).mute = !players.player(`${index}`).mute
    setIsMuted(players.player(`${index}`).mute);
}

  return (
    <div style={{display: "flex"}}>
      <div key={index} className="track">
        <div className="sourceName">
          <h3>{track.name}</h3>
        </div>
        <input
          className="volumeSlider"
          type="range"
          min="-30"
          max="0"
          step="1"
          orient="vertical"
          value={channelVolume}
          style={{
            width: isTabletOrMobile ? "0.4rem" : null,
          }}
          // onTimeUpdate={() => handleTimeUpdate()}
          onChange={(e) => {handleVolumeChange(e.target.value)}}
        />
        <div
          className="muteBox"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
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
        </div>
      </div>
    </div>
  );
};

export default OneChannelControls;
