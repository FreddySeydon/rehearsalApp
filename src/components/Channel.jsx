import React, { useEffect, useRef, useState } from "react";
import "./Channel.css";
import * as Tone from "tone";
import OneChannelControls from "./OneChannelControls";
import iconPlay from "../assets/img/play.png";
import iconPause from "../assets/img/pause.png";
import iconStop from "../assets/img/stop.png";
import loadingSpinner from "../assets/img/loading.gif";

const Channel = ({
  formatTime,
  statePlayers,
  setStatePlayers,
  stateSolos,
  setStateSolos,
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
  setSeekUpdateInterval,
  playersLoaded,
  setPlayersLoaded,
  clearMute,
  setClearMute,
  isStopped,
  setIsStopped,
  setPlayerStopped,
  playerStopped
}) => {
  const playersRef = useRef(null);
  const solosRef = useRef({});
  const intervalRef = useRef(null);

  useEffect(() => {
    if (playersRef.current) {
      playersRef.current.dispose();
    }
    if (stateSolos) {
      Object.values(stateSolos).forEach((solo) => solo.dispose());
    }

    playersRef.current = new Tone.Players();
    solosRef.current = {};
    loadTracks(playersRef.current);

    setClearMute(!clearMute);

    return () => {
      if (Tone.Transport.state === "started") {
        Tone.Transport.stop();
        setPlaying(false);
      }
      if (playersRef.current) {
        playersRef.current.dispose();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setPlayersLoaded(false);
      setStatePlayers(null);
      setStateSolos(null);
    };
  }, [selectedSong]);

  const loadTracks = (players) => {
    const solos = {};
    sources?.forEach((track, index) => {
      players.add(`${index}`, track.src);
      solos[index] = new Tone.Solo().toDestination();
      players.player(`${index}`).connect(solos[index]);
      players.player(`${index}`).buffer.onload = () => {
        setTrackDuration(players.player(`${index}`).buffer.duration);
        setPlayersLoaded(true);
      };
      players.player(`${index}`).sync().start(0);
      players.player(`${index}`).volume.value = -10;
    });
    setStatePlayers(players);
    setStateSolos(solos);
  };

  const handleGlobalSeek = (value) => {
    if (Tone.Transport.state === "started") {
      Tone.Transport.pause();
      Object.values(playersRef.current._players).forEach((player) => player.sync());
      setGlobalSeek(value);
      Tone.Transport.seconds = value;
      Tone.Transport.start();
    } else {
      Object.values(playersRef.current._players).forEach((player) => player.sync());
      setGlobalSeek(value);
      Tone.Transport.seconds = value;
    }
  };

  useEffect(() => {
    if (Tone.Transport.state === "started") {
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  }, [globalSeek]);

  useEffect(() => {
    handleStop();
  }, [isStopped]);

  const handlePlay = () => {
    if (playersRef.current._buffers.loaded) {
      intervalRef.current = setInterval(() => {
        setGlobalSeek(Tone.Transport.seconds);
        if (Tone.Transport.seconds >= trackDuration) {
          Tone.Transport.stop();
        }
      }, 10);
      Tone.Transport.start();
      setSeekUpdateInterval(intervalRef.current);
    }
  };

  const handlePlayPause = async () => {
    if (Tone.Transport.state === "started") {
      handlePause();
    } else {
      await Tone.start();
      handlePlay();
      setPlaying(true);
      setPlayerStopped(false);
    }
  };

  const handlePause = () => {
    Tone.Transport.pause();
    setPlaying(false);
  };

  const handleStop = () => {
    if (playing) {
      Tone.Transport.stop();
      setPlayerStopped(true);
      setGlobalSeek(0);
      setPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }
    if (setPlayerStopped) {
      Tone.Transport.stop();
      setPlayerStopped(true);
      setGlobalSeek(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  return (
    <div className="controlsWrapper" style={{ width: '95%' }}>
      <div className="trackControlsContainer" style={{ overflowX: 'scroll', whiteSpace: 'nowrap' }}>
        <div className="trackControls" style={{ width: 'max-content' }}>
          {false ? (
            <div>Loading...</div>
          ) : (
            sources?.map((track, index) => (
              <OneChannelControls
                key={index}
                players={statePlayers}
                track={track}
                index={index}
                sources={sources}
                isTabletOrMobile={isTabletOrMobile}
                isDesktopOrLaptop={isDesktopOrLaptop}
                statePlayers={statePlayers}
                clearMute={clearMute}
                stateSolos={stateSolos}
              />
            ))
          )}
        </div>
      </div>
      <div className="globalControls" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', width: "100%" }}>
        <div className="controls">
          <button
            style={{
              marginRight: "0.25rem",
              marginLeft: "0.25rem",
              backgroundColor: "transparent",
              opacity: playersLoaded ? 1 : 0.5
            }}
            disabled={!playersLoaded}
            onClick={handlePlayPause}
          >
            <img
              style={{ width: "3rem" }}
              src={!playersLoaded ? loadingSpinner : playing ? iconPause : iconPlay}
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
            disabled={!playersLoaded || playerStopped}
          >
            <img
              style={{ width: "3rem", opacity: !playersLoaded || playerStopped ? 0.5 : 1 }}
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
            value={Tone.Transport.seconds || 0}
            onChange={(e) => {
              handleGlobalSeek(e.target.value);
            }}
          />
          <div style={{ fontWeight: "bold", fontSize: isTabletOrMobile ? "1.5rem" : "1.1rem" }}>{formatTime(globalSeek)}</div>
        </div>
      </div>
    </div>
  );
};

export default Channel;
