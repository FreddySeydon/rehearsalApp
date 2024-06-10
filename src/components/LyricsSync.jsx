import React, { useState, useEffect, useRef } from 'react';
import './LyricsSync.css'
import { Transport } from 'tone';
import * as Tone from "tone";
import { parseLrcTimeToSeconds } from '../../utils/lrcParser';
import iconPlay from "../assets/img/play.png"
import iconPause from "../assets/img/pause.png"
import iconStop from "../assets/img/stop.png"
import iconRight from "../assets/img/right-chevron.svg"
import iconLeft from "../assets/img/left-chevron.svg"

const LyricsSync = ({
  statePlayers,
  globalSeek,
  setGlobalSeek,
  selectedSong,
  isTabletOrMobile,
  hideMixer,
  setHideMixer,
  setPlaying,
  playing
}) => {
  const [lyrics, setLyrics] = useState('');
  const [lines, setLines] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [editing, setEditing] = useState(true);
  const [info, setInfo] = useState('')

  const lyricsRef = useRef();

  const handleLyricsChange = (e) => {
    setLyrics(e.target.value);
    setLines(e.target.value.split('\n'));
  };

  const handleSync = () => {
    if(!playing){
        handlePlay()
    }
    const now = globalSeek.toFixed(2)
    const minutes = Math.floor(now / 60);
    const seconds = Math.floor(now % 60);
    const milliseconds = Math.floor((now % 1) * 100);
    const time = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
    setTimestamps((prev) => {
        const newTimestamps = [...prev];
        newTimestamps[currentLineIndex] = {time: time, line: lines[currentLineIndex]};
        return newTimestamps;
    });
    setCurrentLineIndex((prev) => prev + 1);
  };

  const handleEditTimestamp = (index, newTime) => {
    setTimestamps((prev) =>
      prev.map((timestamp, i) =>
        i === index ? { ...timestamp, time: newTime } : timestamp
      )
    );
  };

  const handleStop = () => {
    Transport.stop();
    Object.values(statePlayers._players).forEach((player) => player.stop());
    setCurrentLineIndex(0);
    setPlaying(false);
  };

  const handlePause = () => {
    Transport.pause();
    Object.values(statePlayers._players).forEach((player) => player.pause());
    setPlaying(false);
  }

  const handlePlay = () => {
    if(statePlayers._buffers.loaded){
    const intervalId = setInterval(() => {
      setGlobalSeek(Tone.Transport.seconds);
      if(Tone.Transport.seconds >= trackDuration){
        Tone.Transport.stop()
      }
    }, 10);
    
    Tone.Transport.start();
    setSeekUpdateInterval(intervalId);
  }
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

  const handlePreview = () => {
    handleStop();
    // setEditing(true);
    setGlobalSeek(0);
    Transport.start();
    Object.values(statePlayers._players).forEach((player) => player.start(0));
  };

  const handleReset = () => {
    setTimestamps([]);
    handleStop();
  }

  const handleDoneEditing = () => {
    if(!lyrics){
        setInfo("You have to put in some lyrics to start syncing")
        return
    }
    setInfo('');
    setEditing(false);
  }

  const goToLyricsPosition = (position, index) => {
    const secondsPosition = parseLrcTimeToSeconds(position);
    if(Transport.state === "started"){
      Transport.pause();
      Object.values(statePlayers._players).forEach((player) => player.sync());
      Transport.seconds = secondsPosition;
      setGlobalSeek(secondsPosition);
      setCurrentLineIndex(index+1);
    //   setUserSeek(!userSeek);
      Transport.start();
    } else {
      Transport.seconds = secondsPosition;
      Object.values(statePlayers._players).forEach((player) => player.sync());
      setGlobalSeek(secondsPosition);
      setCurrentLineIndex(index+1);
    //   setUserSeek(!userSeek);
    }
  };

  useEffect(() => {
    const scrollToCurrentLine = () => {
      const currentLine = document.getElementById(`line-${currentLineIndex}`);
      if (currentLine) {
        currentLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    scrollToCurrentLine();
  }, [currentLineIndex]);

  return (
    <div className="lyricsWrapper" style={{ width: isTabletOrMobile ? '100%' : hideMixer ? '100%' : '25rem'}}>
        <div id='lyricsinput' style={{display: editing ? "flex" : "none", flexDirection: "column" }}>
    <textarea
      rows="10"
      cols="50"
      placeholder="Paste your lyrics here..."
      value={lyrics}
      onChange={handleLyricsChange}
      className='lyricsinputarea glasstransparent'
    />
    <p style={{color: "darkred"}}>{info ? info : null}</p>
    <button onClick={handleDoneEditing}>Done</button>
        </div>

    <div id='lyricssync'  style={{display: editing ? "none" : 'flex', flexDirection: "column"}}>
      <div className='lyricsdisplay' ref={lyricsRef}>
        {lines.map((line, index) => (
          <div key={index} id={`line-${index}`} className="line"  style={{
            // paddingRight: "1rem",
            // paddingLeft: "1rem",
            margin: "1rem",
            // cursor: "pointer",
            fontSize: "1.5rem", //isTabletOrMobile ? "2rem" : "1.5rem"
            fontWeight: currentLineIndex -1 === index ? "bold" : "normal",
            color: currentLineIndex -1 === index ? "#fdc873" : "white",
          }}>
            <span style={{display: 'flex', flexDirection: "row", gap: 10}}>
              {!timestamps[index] ? <div style={{minWidth: 90}}></div> : (
                <input
                type="text"
                value={timestamps[index].time}
                onChange={(e) => handleEditTimestamp(index, e.target.value)}
                style={{minWidth: 70, maxWidth: 70, textAlign: 'center'}}
                className='timestamp glasstransparent'
                />
              )}
              {" "} {timestamps[index] ? <a style={{
                fontWeight: currentLineIndex -1 === index ? "bold" : "normal",
                color: currentLineIndex -1 === index ? "#fdc873" : "white",
                cursor: "pointer",
                textAlign: "left"
            }} 
                onClick={() => goToLyricsPosition(timestamps[index].time, index)} 
                >{line}</a> : <p style={{margin: 0, padding: 0, textAlign: "left"}}>{line}</p>}
            </span>
          </div>
        ))}
      </div>
                <div style={{display: "flex", flexDirection: "column", gap:10, paddingTop: 10}}>
                    <div>
                  {currentLineIndex + 1 > lines.length ? null : <button onClick={handleSync} style={{
                    marginRight: "0.25rem",
                    marginLeft: "0.25rem",
                    backgroundColor: "transparent",
                    }}><img src={iconRight} alt="Next Line" style={{ width: "3rem"}} /></button>}
                    </div>
                    <div>
                  <button onClick={handlePlayPause}             
                  style={{
                    marginRight: "0.25rem",
                    marginLeft: "0.25rem",
                    backgroundColor: "transparent",
                    }}>
                <img src={playing ? iconPause : iconPlay} alt={playing ? "Pause" : "Play"} style={{ width: "3rem"}} />
                </button>
                  <button onClick={handleStop} style={{
                    marginRight: "0.25rem",
                    marginLeft: "0.25rem",
                    backgroundColor: "transparent",
                    }}><img src={iconStop} alt="Stop" style={{ width: "3rem"}}  /></button>
                    </div>
                    <div>
                  {/* <button onClick={handlePreview}>Preview</button> */}
                  <button onClick={() => setEditing(true)}>Edit</button>
                  <button onClick={handleReset}>Reset</button>
                    </div>
                </div>
      <button
        onClick={() => {
          const lrcContent = timestamps
            .map(({ time, line }) => {
              return `[${time}]${line}`;
            })
            .join('\n');
          const blob = new Blob([lrcContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${selectedSong}.lrc`;
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        Download LRC
      </button>
    </div>
    {hideMixer ? <button onClick={() => setHideMixer(!hideMixer)} style={{width: "100%", marginTop: 5}}>{hideMixer ? "Show Mixer" : "Hide Mixer"}</button> : null}

    </div>
  );
};

export default LyricsSync;
