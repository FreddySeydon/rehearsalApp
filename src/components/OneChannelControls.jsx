import React from "react";

const OneChannelControls = () => {
  return (
    <div>
      <div key={index} className="track">
        <div className="sourceName">
          <h3>{source.name}</h3>
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
            background: sliderColor,
            width: isTabletOrMobile ? "0.4rem" : null,
          }}
          // onTimeUpdate={() => handleTimeUpdate()}
          onChange={(e) => {
            sound.volume(e.target.value);
            setChannelVolume(sound.volume(soundId));
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
            onClick={() => setIsMuted(!isMuted)}
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
