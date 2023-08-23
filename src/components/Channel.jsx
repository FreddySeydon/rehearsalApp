import React, { useEffect } from "react";
import "./Channel.css";
import * as Tone from "tone";
import OneChannelControls from "./OneChannelControls";
import iconPlay from "../assets/img/play.png"
import iconPause from "../assets/img/pause.png"
import iconStop from "../assets/img/stop.png"

const Channel = ({
  formatTime,
  statePlayers,
  setStatePlayers,
  setTrackDuration,
  trackDuration,
  selectedSong,
  setSelectedSong,
  globalSeek,
  setGlobalSeek,
  sources,
  loading,
  setLoading,
  isBigScreen,
  isTabletOrMobile,
  isDesktopOrLaptop,
  playing,
  setPlaying,
  sounds,
  seekUpdateInterval,
  setSeekUpdateInterval
}) => {
  useEffect(() => {
    const players = new Tone.Players().toDestination();
    loadTracks(players);

    return () => {
      players.dispose();
      clearInterval(seekUpdateInterval);
    };
  }, [selectedSong]);

  const loadTracks = (players) => {
    if (players._players.size === 0) {
      sources.map((track, index) => {
        players.add(`${index}`, track.src);
        if (index === 0) {
          players.player(`${index}`).buffer.onload = () =>
            setTrackDuration(players.player(`${index}`).buffer.duration);
        }
        players.player(`${index}`).sync().start(0);
        players.player(`${index}`).volume.value = -10
      });
      setStatePlayers(players);
    }
  };

  const handleGlobalSeek = (value) => {
    if (Tone.Transport.state === "started") {
      Tone.Transport.pause();
      Object.values(statePlayers._players).forEach((player) => player.sync());
      setGlobalSeek(value);
      Tone.Transport.seconds = value;
      Tone.Transport.start();
    } else {
      Object.values(statePlayers._players).forEach((player) => player.sync());
      setGlobalSeek(value);
      Tone.Transport.seconds = value;
    }
  };

  useEffect(() => {
    if(Tone.Transport.state==="started"){
      setPlaying(true)
    } else {
      setPlaying(false)
    }
  },[globalSeek])

  const handlePlay = () => {
    const intervalId = setInterval(() => {
      setGlobalSeek(Tone.Transport.seconds);
      if(Tone.Transport.seconds >= trackDuration){
        Tone.Transport.stop()
      }
    }, 10);
    Tone.Transport.start();
    setSeekUpdateInterval(intervalId);
  };

  const handlePlayPause = async () => {
    if (Tone.Transport.state === "started") {
      handlePause();
    } else {
      await Tone.start();
      handlePlay();
      setPlaying(true);
    }
  };
  const handlePause = () => {
    Tone.Transport.pause();
    setPlaying(false);
  };
  const handleStop = () => {
    Tone.Transport.stop();
    setGlobalSeek(0);
    setPlaying(false);
    clearInterval(seekUpdateInterval);
  };

  const handleSongChange = (e) => {
    setSelectedSong(e.target.value);
  }

  return (
    <div className="controlsWrapper">
    <div className="trackControls" style={{ display: "flex" }}>
      {false ? (
        <div>Loading...</div>
      ) : (
        sources.map((track, index) => {
          return (
            <OneChannelControls
              key={index}
              players={statePlayers}
              track={track}
              index={index}
              sources={sources}
              isTabletOrMobile={isTabletOrMobile}
              isDesktopOrLaptop={isDesktopOrLaptop}
              statePlayers={statePlayers}
            />
          );
        })
      )}
      </div>
      <div className="globalControls">
      <select
              value={selectedSong}
              onChange={(e) => {handleSongChange(e)}}
              onClick={handleStop}
              style={{minWidth: "10rem", minHeight: "2.5rem", textAlign:"center", fontSize:"1.2rem", fontWeight:"bold"}}
            >
              {Object.keys(sounds).map((key) => (
                <option key={key} value={key}>
                  {sounds[key].songname}
                </option>
              ))}
            </select>
        <div className="controls">
          <button
            style={{
              marginRight: "0.25rem",
              marginLeft: "0.25rem",
              backgroundColor: "transparent",
            }}
            onClick={handlePlayPause}
          >
            <img
              style={{ width: "3rem" }}
              src={playing ? iconPause : iconPlay}
              alt="Play Button"
            />
          </button>
          <button
            style={{
              marginRight: "0.25rem",
              marginLeft: "0.25rem",
              backgroundColor: "transparent",
            }}
            onClick={handleStop}
            // disabled={isStopped ? false : true}
          >
            <img
              style={{ width: "3rem", opacity: 1 }}
              src={iconStop}
              alt="Stop Button"
            />
          </button>
        </div>
        <div className="globalSeek">
          <input
            type="range"
            min="0"
            max={trackDuration || 0}
            value={Tone.Transport.seconds}
            onChange={(e) => {
              handleGlobalSeek(e.target.value);
            }}
            // onInput={() => setUserSeek(!userSeek)}
          />
          <div style={{fontWeight: "bold", fontSize: isTabletOrMobile ? "1.5rem" : "1.1rem"}}>{formatTime(globalSeek)}</div>
        </div>
      </div>
    </div>
  );
};

export default Channel;
