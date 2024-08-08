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
import LoadingSpinner from './LoadingSpinner';
import { formatTimeMilliseconds } from '../../utils/lrcParser';
import resetIcon from '../assets/img/reset.svg'
import loadingIcon from '../assets/img/loading.gif'
import OneSyncLine from './OneSyncLine';
import iconSave from "../assets/img/save.svg"

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
  fetchAlbums,
  noTrackLrc,
  playersLoaded,
  setHideSelects
}) => {
  const [lyrics, setLyrics] = useState('');
  const [lines, setLines] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false);
  const [doneSaving, setDoneSaving] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(true);

  const lyricsRef = useRef();
  const currentLineRef = useRef();

  const handleLyricsChange = (e) => {
    const newLyrics = e.target.value;
    const newLines = newLyrics.split('\n');
    setLyrics(newLyrics);
  
    setTimestamps((prevTimestamps) => {
      const newTimestamps = [];
      const prevLines = lines;

  
      for (let i = 0; i < newLines.length; i++) {
        if (i < prevTimestamps.length) {
          if (!prevTimestamps[i]) {
            console.warn(`Undefined timestamp at index ${i}`);
            continue;
          }
  
          if (newLines[i] !== prevLines[i]) {
            // Line has changed, update the line text
            newTimestamps.push({ ...prevTimestamps[i], line: newLines[i].trim() });
          } else {
            // Line has not changed, keep the existing timestamp
            newTimestamps.push(prevTimestamps[i]);
          }
        } else {
          // New line added, no timestamp set initially
          newTimestamps.push({ time: null, line: newLines[i].trim() });
        }
      }
  
      // If lines are deleted, keep the existing timestamps up to the new length
      if (newLines.length < prevTimestamps.length) {
        return newTimestamps.slice(0, newLines.length);
      }
  
      return newTimestamps;
    });
  
    setLines(newLines);
  };
  
  
  
  
  
  

  const initializeLyrics = () => {
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
      setCurrentLineIndex(0)
  
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
  }
  

  useEffect(() => {
    initializeLyrics();
  }, [existingLyrics, currentTrackLrc]);


  
  useEffect(() => {
    setLyricsLoading(true);
    if(existingLyrics && lines.length || noTrackLrc){
      setLyricsLoading(false);
    }

  }, [existingLyrics, noTrackLrc, lines])

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

  const handleUnsyncedLines = () => {
    if (timestamps.length !== lines.length) {
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
        // setTimestamps((prev) => {
        //     const newTimestamps = [...prev];
        //     newTimestamps.pop();
        //     return newTimestamps;
        // });
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
    handleStop();
    if(existingLyrics){
      initializeLyrics();
      return
    }
    setTimestamps([])
  }

  const handleDoneEditing = () => {
    if(!lyrics){
        setInfo("You have to put in some lyrics to start syncing")
        return
    }
    setInfo('');
    setEditing(false);
    setHideSelects(true);
    
  }

  const handleStartEditing = () => {
    if(Tone.Transport.state === "started"){
        handlePause();
    }
    setEditing(true);

  }

  // useEffect(() => {
  //   console.log("Timestamps: ", timestamps)
  // }, [timestamps])

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

  // useEffect(() => {
  //   const scrollToCurrentLine = () => {
      // const currentLine = document.getElementById(`line-${currentLineIndex}`);
      // const lyricssync = document.getElementById(`lyricsdisplay`);
      // if (lyricssync) {
        // currentLineRef.current = currentLine;
        // const yOffset = 40
        // const y = lyricssync.getBoundingClientRect().top + yOffset
        // console.log("y:",y)
        // isTabletOrMobile ? window.scrollTo({top: lyricssync, behavior: 'smooth'}) : null
        // currentLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // currentLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // lyricssync.scrollIntoView()
  //     }
  //   };
  //   scrollToCurrentLine();
  // }, [currentLineIndex]);

  const handleContinueEditing = () => {
    window.location.reload()
    // handleReset()
    // setDoneSaving(false)
    // fetchAlbums()
  }

  // if(lyricsLoading){
  //   return <LoadingSpinner />
  // }

  return (
    <>
    {isSaving ? 
      <div style={{marginTop: 300}}>
      <LoadingSpinner />
      Saving...
      </div> : doneSaving ? <div style={{marginTop: 300}}> <p style={{fontSize: "x-large"}}>Lyrics saved successfully!</p> <div style={{display: "flex", flexDirection: "column", gap: 5, width: "100%"}}> <Link to={`/player?albumId=${selectedAlbum}&songId=${selectedSong}&trackId=${selectedTrack}`}> <button className='glass' style={{width: "100%"}}>Go to Song</button></Link>  <button className='glasstransparent' style={{width: "100%", color: "white"}} onClick={handleContinueEditing}>Continue Editing</button> </div> </div> : error ? <div><p>There was an error saving your lyrics</p><button onClick={() => setError('')}>Try again</button></div>  :
    lyricsLoading ? <LoadingSpinner /> :
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
    <Link to={`/albums/${selectedAlbum}/${selectedSong}`} style={{marginTop: 20, marginBottom: 15, fontSize: 'small'}}>
    <p style={{textDecoration: "underline", margin: 0.5, color: 'whitesmoke'}}>Already have synced lyrics in .lrc format?</p>
    <p style={{textDecoration: "underline", margin: 0.5, color: 'whitesmoke'}}>Upload them!</p>
    
    </Link>
        </div>

    <div id='lyricssync'  style={{display: editing ? "none" : 'flex', flexDirection: "column", height: 650}}>
      <div id='lyricsdisplay' className='lyricsdisplay' ref={lyricsRef} style={{overflowY: 'scroll', scrollbarWidth: 'none'}}>
        {lines.map((line, index) => (
          <OneSyncLine key={index} index={index} line={line} currentLineIndex={currentLineIndex} timestamps={timestamps} handleEditTimestamp={handleEditTimestamp} goToLyricsPosition={goToLyricsPosition}  />
        ))}
      </div>
                <div style={{display: "flex", flexDirection: "column", gap:10, paddingTop: 10}}>
                  <p style={{margin: 0, color: '#fdc873'}}>{info ? info : null}</p>
                    <div style={{display: 'flex', flexDirection: "row", justifyContent: "center", alignItems: "center"}}>
                  {<button onClick={handlePreviousLine} disabled={currentLineIndex - 1 <= 0 ? true : false} style={{
                    marginRight: "0.25rem",
                    marginLeft: "0.25rem",
                    backgroundColor: "transparent",
                    }}><img src={iconLeft} alt="Previous Line" style={{ width: "1.5rem", opacity: currentLineIndex - 1 <= 0 ? 0.5 : 1 }} /></button>}

                  {<button onClick={handleSync} disabled={currentLineIndex + 1 > lines.length ? true : false} style={{
                    marginRight: "0.25rem",
                    marginLeft: "0.25rem",
                    backgroundColor: "transparent",
                    opacity: currentLineIndex + 1 > lines.length ? 0.5 : 1 
                    }}><img src={iconRight} alt="Next Line" style={{ width: "3rem"}} /></button>}
                    </div>
                    <div>
                  <button onClick={handlePlayPause} 
                  disabled={!playersLoaded}            
                  style={{
                    marginRight: "0.25rem",
                    marginLeft: "0.25rem",
                    backgroundColor: "transparent",
                    }}>
                <img src={!playersLoaded ? loadingIcon : playing ? iconPause : iconPlay} alt={playing ? "Pause" : "Play"} style={{ width: "3rem"}} />
                </button>
                  <button onClick={handleStop} style={{
                    marginRight: "0.25rem",
                    marginLeft: "0.25rem",
                    backgroundColor: "transparent",
                    }}><img src={iconStop} alt="Stop" style={{ width: "3rem"}}  /></button>
                            <div className="globalSeek" style={{width: "95%", marginLeft: "2.5%"}}>
                      <input
                        type="range"
                        min="0"
                        max={trackDuration || 0}
                        value={Tone.Transport.seconds || 0}
                        onChange={(e) => {
                          handleGlobalSeek(e.target.value);
                        }}
                      />
                      <div style={{ fontWeight: "bold", fontSize: isTabletOrMobile ? "1.5rem" : "1.1rem" }}>{formatTimeMilliseconds(globalSeek)}</div>
                    </div>
                    </div>
                    <div style={{display: "flex", flexDirection: 'column', alignItems: "center", justifyContent: "center", gap: 10}}>
                  {/* <button onClick={handlePreview}>Preview</button> */}
                  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5}}>
                  <button onClick={handleStartEditing} style={{backgroundColor: "transparent", borderWidth: 3, padding: 2}}><img src={iconEdit} alt="Edit" style={{ width: "4.5rem", marginBottom: 6}} /></button>
                  <button onClick={handleReset} style={{backgroundColor: "transparent", borderWidth: 3, margin: 0, padding: 5}}> <img src={resetIcon} alt="Reset Sync" style={{ width: "3.5rem", marginBottom: 6}} /> </button>
      {lines.length === timestamps.length ? <button
        onClick={() => {
          handleUnsyncedLines()
          const lrcContent = timestamps
          .map(({ time, line }) => {
            return `[${time}]${line}`;
          })
          .join('\n');
          const blob = new Blob([lrcContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${selectedSong}_${selectedTrack}.lrc`;
          a.click();
          URL.revokeObjectURL(url);
        }}
        style={{backgroundColor: "transparent", padding: 5, borderWidth: 3,}}
        >
        <img src={iconDownload} alt="Download LRC" style={{ width: "3.5rem", marginBottom: 6}} />
      </button> : null}
        <button onClick={handleSaveLyrics} style={{backgroundColor: 'transparent', borderWidth: 3, padding: 5}}> <img src={iconSave} alt="Save Lyrics" style={{ width: "3.5rem", marginBottom: 6}} /> </button>
                  </div>
                    </div>
                </div>
    </div>
    {/* {hideMixer ? <button onClick={() => setHideMixer(!hideMixer)} style={{width: "100%", marginTop: 5, color: 'whitesmoke'}} className='glasstransparent'>{hideMixer ? "Show Mixer" : "Hide Mixer"}</button> : null} */}

    </div>
    }
    </>
  );
};

export default LyricsSync;
