import React from "react";
import { useState, useEffect } from "react";
import { parseLyrics, syncLyrics } from "../../utils/lrcParser";
import OneLine from "./OneLine";
import "./Lyrics.css";
import { Transport } from "tone";

const Lyrics = ({
  sounds,
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
  isTabletOrMobile
}) => {
  const [displayedLyrics, setDisplayedLyrics] = useState("");
  const [currentLyrics, setCurrentLyrics] = useState([]);
  const [displayedLyricsIndex, setDisplayedLyricsIndex] = useState(0);

  useEffect(() => {
    const loadLrc = async () => {
      setLoading(true);
      const lrcLocation = sounds[selectedSong].tracks[0].lrc;
      const res = await fetch(lrcLocation);
      const lrc = await res.text();
      setLrcContent(lrc);
      setLoading(false);
    };
    loadLrc();
  }, [selectedSong]);

  const displayCurrentLyrics = () => {
    const lyrics = parseLyrics(lrcContent);
    setCurrentLyrics(lyrics);
    const index = syncLyrics(lyrics, globalSeek);
    setDisplayedLyricsIndex(index);
    if (index === null) return;
    setDisplayedLyrics(lyrics[index].text);
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
      <div className="lyricsWrapper" style={{width: isTabletOrMobile ? "100%" : "25rem", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", marginLeft: isTabletOrMobile ? 0 : "5rem"}}>
        <h3>Lyrics</h3>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div style={{ display: "none" }}>{displayedLyrics}</div>
        )}
        <div className="lyricsdisplay">
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
