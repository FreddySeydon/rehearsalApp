import React from "react";
import { useState, useEffect, useRef } from "react";
import { parseLyrics, syncLyrics } from "../../utils/lrcParser";
import OneLine from "./OneLine";
import "./Lyrics.css";
import { Transport } from "tone";
import { Link } from "react-router-dom";

const Lyrics = ({
  sounds,
  currentLrcs,
  statePlayers,
  selectedSong,
  lrcContent,
  setLrcContent,
  loading,
  setLoading,
  globalSeek,
  setGlobalSeek,
  userSeek,
  setUserSeek,
  isBigScreen,
  isDesktopOrLaptop,
  isTabletOrMobile,
  selectedTrack,
  selectedAlbum,
  setNoLrcs,
  noLrcs,
  noTrackLrc,
  setNoTrackLrc,
  hideMixer,
}) => {
  const [displayedLyrics, setDisplayedLyrics] = useState("");
  const [currentLyrics, setCurrentLyrics] = useState([]);
  const [displayedLyricsIndex, setDisplayedLyricsIndex] = useState(0);
  const [currentLrc, setCurrentLrc] = useState({})

  const lyricsRef = useRef();
  

  useEffect(() => {
    console.log("Current: ",currentLrcs)
    const loadLrc = async () => {
      setLoading(true);
      if(currentLrcs.length === 0){
        console.log("No lrc found")
        setLoading(false);
        return
      }
      const currentLrc = currentLrcs.find((lrc) => lrc.trackId === selectedTrack)
      console.log("one:", currentLrc)
      if(currentLrc){
        const lrcLocation = currentLrc.lrc
      const lrc = await lrcLocation.text();
      setCurrentLrc(currentLrc);
      setLrcContent(lrc);
      setLoading(false);
      return
      }
      setNoTrackLrc(true);
      setLoading(false)

    };
    loadLrc();
    lyricsRef.current.scrollTo(0,0);
  }, [selectedSong, selectedTrack]);

  const displayCurrentLyrics = () => {
    if(lrcContent){
      const lyrics = parseLyrics(lrcContent);
      setCurrentLyrics(lyrics);
      const index = syncLyrics(lyrics, globalSeek);
      setDisplayedLyricsIndex(index);
      if (index === null) return;
      setDisplayedLyrics(lyrics[index].text);
    }
  };

  useEffect(() => {
    if (globalSeek == 0) {
      setDisplayedLyrics("");
    }
    if (!loading) {
      displayCurrentLyrics();
    }
    return;
  }, [globalSeek, loading]);

  const goToLyricsPosition = (position) => {
    if(Transport.state === "started"){
      Transport.pause();
      Object.values(statePlayers._players).forEach((player) => player.sync());
      Transport.seconds = position;
      setGlobalSeek(position);
      setUserSeek(!userSeek);
      Transport.start();
    } else {
      Transport.seconds = position;
      Object.values(statePlayers._players).forEach((player) => player.sync());
      setGlobalSeek(position);
      setUserSeek(!userSeek);
    }
  };

  return (
    <>
      <div className="lyricsWrapper" style={{width: isTabletOrMobile ? "100%" : "25rem", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", marginLeft: isTabletOrMobile ? 0 : 0}}>
        {/* <h3>Lyrics</h3> */}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div style={{ display: "none" }}>{displayedLyrics}</div>
        )}
        <div ref={lyricsRef} className="lyricsdisplay" style={{width: "100%", overflowY: 'scroll', scrollbarWidth: 'none'}}>
          {currentLyrics.map((line, index) => {
            return (
              <div key={index}>
                {" "}
                <OneLine
                  line={line}
                  key={index}
                  index={index}
                  goToLyricsPosition={goToLyricsPosition}
                  displayedLyricsIndex={displayedLyricsIndex}
                  isBigScreen={isBigScreen}
                  isDesktopOrLaptop={isDesktopOrLaptop}
                  isTabletOrMobile={isTabletOrMobile}
                />{" "}
              </div>
            );
          })}
        </div>
        {!currentLrc.fullySynced ?         
        <Link to={`/lyricseditor?albumId=${selectedAlbum}&songId=${selectedSong}&trackId=${selectedTrack}`}>
          <p style={{textDecoration: "underline", margin: 0.5, color: 'whitesmoke'}}>Lyrics are not synced completely yet.</p>
          {/* <p style={{textDecoration: "underline", margin: 0.5, color: 'whitesmoke'}}>Click here to go to Sync</p> */}
        </Link> : null
      }
      </div>
    </>
  );
};

export default Lyrics;
