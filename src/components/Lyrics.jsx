import React from "react";
import { useState, useEffect, useRef } from "react";
import { parseLyrics, syncLyrics } from "../../utils/lrcParser";
import OneLine from "./OneLine";
import "./Lyrics.css";
import { Transport } from "tone";

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
  setNoLrcs,
  noLrcs,
  noTrackLrc,
  setNoTrackLrc
}) => {
  const [displayedLyrics, setDisplayedLyrics] = useState("");
  const [currentLyrics, setCurrentLyrics] = useState([]);
  const [displayedLyricsIndex, setDisplayedLyricsIndex] = useState(0);

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
        <div ref={lyricsRef} className="lyricsdisplay">
          {currentLyrics.map((line, index) => {
            return (
              <div key={index} style={{width: isTabletOrMobile ? "100%" : "25rem"}}>
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
      </div>
    </>
  );
};

export default Lyrics;
