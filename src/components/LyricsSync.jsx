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
import iconEdit from "../assets/img/edit.svg"
import iconDownload from "../assets/img/download.svg"
import { updateLrc } from '../../utils/databaseOperations';
import { InputMask } from '@react-input/mask';
import { Link } from 'react-router-dom';

const LyricsSync = ({
  statePlayers,
  globalSeek,
  setGlobalSeek,
  selectedSong,
  isTabletOrMobile,
  hideMixer,
  setHideMixer,
  setPlaying,
  playing,
  trackDuration,
  existingLyrics,
  selectedTrack,
  selectedAlbum,
  editing,
  setEditing,
  lrcs,
  setSeekUpdateInterval,
  seekUpdateInterval,
  songs,
  user,
  currentTrackLrc,
  fetchAlbums
}) => {
  const [lyrics, setLyrics] = useState('');
  const [lines, setLines] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false);
  const [doneSaving, setDoneSaving] = useState(false);

  const lyricsRef = useRef();

  // console.log("Selected: ", "A: ",selectedAlbum, "S: ", selectedSong,"T: ", selectedTrack)

  const handleLyricsChange = (e) => {
    const newLyrics = e.target.value;
    const newLines = newLyrics.split('\n');
    setLyrics(newLyrics);
    setLines(newLines);

    // Adjust timestamps based on changes in lines
    setTimestamps((prevTimestamps) => {
      const newTimestamps = [];
      newLines.forEach((line, index) => {
        if (index < prevTimestamps.length) {
          newTimestamps.push(prevTimestamps[index]);
        }
      });
      return newTimestamps;
    });
  };

  useEffect(() => {
    if (existingLyrics) {      
      const cleanLyrics = [];
      const existingTimestamps = [];
      const linesSet = new Set();
      let repeatedTimestamp = false;
  
      // Parse existing lyrics to timestamps
      existingLyrics.split('\n').forEach((line, index) => {
        const match = line.match(/^\[(?<time>\d{2}:\d{2}(.\d{2})?)\](?<text>.*)/);
        if (match) {
          const { time, text } = match.groups;
          cleanLyrics.push(text);
          if (!repeatedTimestamp) {
            if (linesSet.has(time)) {
              repeatedTimestamp = true;
            } else {
              linesSet.add(time);
              existingTimestamps.push({ time, line: text.trim() });
            }
          }
        }
      });
  
      setLines(cleanLyrics);
      setLyrics(cleanLyrics.join("\n"));
      setCurrentLineIndex(existingTimestamps.length)
  
      if (currentTrackLrc.fullySynced) {
        setTimestamps(existingTimestamps);
      } else {
        // Handle the case when lyrics are not fully synced
        setTimestamps(existingTimestamps);
      }
    } else {
      setLyrics("");
      setLines([]);
      setTimestamps([]);
    }
  }, [existingLyrics, currentTrackLrc]);
  
  
  

  const handleSync = () => {
    setInfo('')
    if (!playing) {
      handlePlay();
      return;
    }
    
    const now = parseFloat(globalSeek).toFixed(2);
    const minutes = Math.floor(now / 60);
    const seconds = Math.floor(now % 60);
    const milliseconds = Math.floor((now % 1) * 100);
    const time = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  
    setTimestamps((prev) => {
      const newTimestamps = [...prev];
  
      // Check if the new timestamp is greater than the previous one
      const lastTimestamp = newTimestamps[currentLineIndex - 1];
      const lastTimeInSeconds = lastTimestamp ? parseLrcTimeToSeconds(lastTimestamp.time) : 0;
      const newTimeInSeconds = parseLrcTimeToSeconds(time);
  
      if (newTimeInSeconds >= lastTimeInSeconds) {
        newTimestamps[currentLineIndex] = { time: time, line: lines[currentLineIndex] };
        setCurrentLineIndex((prev) => prev + 1);
      } else {
        console.warn("New timestamp is less than the previous one. Ignoring this sync.");
        setInfo("Next timestamp can't be lower than the previous one.")
      }
  
      return newTimestamps;
    });
  
  };

  const handleUnsyncedLines = () => {
    if (timestamps.length !== lines.length) {
      console.log("Timestamps length: ",timestamps.length)
      const unsyncedLines = lines.length - timestamps.length;
      console.log(`Handling ${unsyncedLines} unsynced lines`);
      let lastTimestampTime = '00:00.00'
      if(timestamps.length !== 0){
        lastTimestampTime = timestamps.at(-1).time;
      }
      const currentTimestamps = [...timestamps];
  
      for (let lineIndex = currentTimestamps.length; lineIndex < lines.length; lineIndex++) {
        currentTimestamps[lineIndex] = { time: lastTimestampTime, line: lines[lineIndex] };
      }
      setTimestamps(currentTimestamps);
      return currentTimestamps;
    }
    return
  };
  

  const handlePreviousLine = () => {
    if(currentLineIndex - 1 >= 1){
        setTimestamps((prev) => {
            const newTimestamps = [...prev];
            newTimestamps.pop();
            return newTimestamps;
        });
        setCurrentLineIndex((prev) => prev - 1);

    }
  }

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

  const handleStartEditing = () => {
    if(Tone.Transport.state === "started"){
        handlePause();
    }
    setEditing(true);

  }

  const handleSaveLyrics = async () => {
    handlePause()
    setIsSaving(true);
    const currentTimestamps = handleUnsyncedLines();
    const fullySynced = currentTimestamps ? false : true;
    const usedTimestamps = currentTimestamps ? currentTimestamps : timestamps
    const lrcContent = usedTimestamps.map(({ time, line }) => `[${time}]${line}`).join('\n');
    const blob = new Blob([lrcContent], { type: 'text/plain' });
    const thisSong = songs.find((song) => selectedSong === song.id);
    const thisTrack = thisSong?.tracks?.find((track) => selectedTrack === track.id);
    let trackName = thisTrack?.name;
    if(!trackName){
      console.log("Error: Track name missing", trackName, "Selected Track: ", selectedTrack)
      setError('Track name missing')
      setIsSaving(false)
      return
    }
  
    try {
      const updateLrcResult = await updateLrc(blob, selectedAlbum, selectedSong, selectedTrack, trackName, user, fullySynced);
      console.log("Update LRC result: ", updateLrcResult);
      if (updateLrcResult.result === "success") {
        setIsSaving(false);
        setDoneSaving(true);
      } else {
        setError(updateLrcResult.message);
        setIsSaving(false);
        setDoneSaving(false);
      }
    } catch (error) {
      setError(error.message);
      setIsSaving(false);
      setDoneSaving(false);
    }
  };
  

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

  const handleContinueEditing = () => {
    window.location.reload()
    // handleReset()
    // setDoneSaving(false)
    // fetchAlbums()
  }

  return (
    <>
    {isSaving ? 
      <div>
      Saving...
      </div> : doneSaving ? <div> <p>Lyrics saved successfully!</p> <div style={{display: "flex", flexDirection: "column", gap: 5, width: "100%"}}> <Link to={`/player?albumId=${selectedAlbum}&songId=${selectedSong}&trackId=${selectedTrack}`}> <button className='glass' style={{width: "100%"}}>Go to Song</button></Link>  <button className='glasstransparent' style={{width: "100%", color: "white"}} onClick={handleContinueEditing}>Continue Editing</button> </div> </div> : error ? <div><p>There was an error saving your lyrics</p><button onClick={() => setError('')}>Try again</button></div>  :
    
    <div className="lyricsWrapper" style={{ width: '100%'}}>
        <div id='lyricsinput' style={{display: editing ? "flex" : "none", flexDirection: "column" }}>
    <textarea
      rows="20"
      cols="50"
      placeholder="Paste your lyrics here and press 'Done' to start..."
      value={lyrics}
      onChange={handleLyricsChange}
      className='lyricsinputarea glasstransparent'
    />
    <p style={{color: "#fdc873", marginTop: 2, marginBottom: 5}}>{info ? info : null}</p>
    <button onClick={handleDoneEditing} className='glass'>Done</button>
    <Link to={`/albums/${selectedAlbum}/${selectedSong}`} style={{marginTop: 5, fontSize: 'small'}}>
    <p style={{textDecoration: "underline", margin: 0.5, color: 'whitesmoke'}}>Already have synced lyrics in .lrc format?</p>
    <p style={{textDecoration: "underline", margin: 0.5, color: 'whitesmoke'}}>Upload them!</p>
    
    </Link>
        </div>

    <div id='lyricssync'  style={{display: editing ? "none" : 'flex', flexDirection: "column"}}>
      <div className='lyricsdisplay' ref={lyricsRef} style={{overflowY: 'scroll', scrollbarWidth: 'none'}}>
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
                <InputMask
                // ref={timestampInputRef}
                // type="text"
                value={timestamps[index].time}
                mask= 'ab:ab.cc' 
                replacement= {{a: /[0-5]/, b: /[0-9]|0?[0-9]/, c:/[0-9]/}}
                onChange={(e) => handleEditTimestamp(index, e.target.value)}
                style={{minWidth: 70, maxWidth: 70, textAlign: 'center'}}
                className='timestamp glasstransparent'
                // showMask
                separate
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
                  <p style={{margin: 0, color: '#fdc873'}}>{info ? info : null}</p>
                    <div style={{display: 'flex', flexDirection: "row", justifyContent: "center", alignItems: "center"}}>
                  {<button onClick={handlePreviousLine} style={{
                    marginRight: "0.25rem",
                    marginLeft: "0.25rem",
                    backgroundColor: "transparent",
                    }}><img src={iconLeft} alt="Previous Line" style={{ width: "1.5rem", opacity: currentLineIndex - 1 <= 0 ? 0.5 : 1 }} /></button>}

                  {<button onClick={handleSync} style={{
                    marginRight: "0.25rem",
                    marginLeft: "0.25rem",
                    backgroundColor: "transparent",
                    opacity: currentLineIndex + 1 > lines.length ? 0.5 : 1 
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
                    <div style={{display: "flex", flexDirection: 'column', alignItems: "center", justifyContent: "center", gap: 10}}>
                  <button onClick={handleSaveLyrics} className='glass' style={{width: "100%"}}>Save Lyrics</button>
                  {/* <button onClick={handlePreview}>Preview</button> */}
                  <div style={{display: 'flex'}}>
                  <button onClick={handleStartEditing} style={{backgroundColor: "transparent", padding: 0}}><img src={iconEdit} alt="Edit" style={{ width: "4.5rem", marginBottom: 6}} /></button>
                  <button onClick={handleReset} className='glass' style={{backgroundColor: "transparent", borderWidth: 3, margin: 0, padding: 5, border: "dashed", borderColor: "darkred", color: "white"}}>Reset Sync</button>
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
        style={{backgroundColor: "transparent"}}
      >
        <img src={iconDownload} alt="Download LRC" style={{ width: "3.75rem", marginBottom: 6}} />
      </button>
                  </div>
                    </div>
                </div>
    </div>
    {hideMixer ? <button onClick={() => setHideMixer(!hideMixer)} style={{width: "100%", marginTop: 5, color: 'whitesmoke'}} className='glasstransparent'>{hideMixer ? "Show Mixer" : "Hide Mixer"}</button> : null}

    </div>
    }
    </>
  );
};

export default LyricsSync;
