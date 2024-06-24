import React from "react";
import { useState, useEffect, useRef } from "react";
import { parseLyrics, syncLyrics } from "../../utils/lrcParser";
import OneLine from "./OneLine";
import "./Lyrics.css";
import { Transport } from "tone";
import { Link } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";

const Lyrics = ({
  sounds,
  currentLrcs,
  statePlayers,
  selectedSong,
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
  hideMixer,
  playerStopped
}) => {
  const [displayedLyrics, setDisplayedLyrics] = useState("");
  const [currentLyrics, setCurrentLyrics] = useState([]);
  const [displayedLyricsIndex, setDisplayedLyricsIndex] = useState(0);
  const [currentLrc, setCurrentLrc] = useState({});
  const [lyricsLoading ,setLyricsLoading] = useState(true);
  const [noTrackLrc, setNoTrackLrc] = useState(false);
  const [lrcContent, setLrcContent] = useState(null);

  const lyricsRef = useRef();

  console.log("lyrics index: ", displayedLyricsIndex)

  useEffect(() => {
    const loadLrc = async () => {
      if (currentLrcs.length && selectedTrack) {

        if (currentLrcs.length === 0) {
          console.log("No LRC found");
          setLyricsLoading(false);
          return;
        }

        const foundLrc = currentLrcs.find((lrc) => lrc.trackId === selectedTrack);

        if (foundLrc) {
          const lrcLocation = foundLrc.lrc;
          const lrcText = await lrcLocation.text();

          setCurrentLrc(foundLrc);
          setLrcContent(lrcText);
          setNoTrackLrc(false)
        } else {
          setNoTrackLrc(true);
          setLyricsLoading(false);
          // setLrcContent(null)
        }

        // setLyricsLoading(false);
      }
    };

    loadLrc();
    lyricsRef?.current?.scrollTo({top: 0, behavior: "smooth"});
  }, [selectedAlbum, selectedSong, selectedTrack, currentLrcs, setLoading, setLrcContent, setNoTrackLrc, lyricsRef]);

  useEffect(() => {
    if(playerStopped){
      lyricsRef?.current?.scrollTo({top: 0, behavior: "smooth"});
    }
  }, [playerStopped])


  const displayCurrentLyrics = () => {
    if (lrcContent) {
      const lyrics = parseLyrics(lrcContent);
      setCurrentLyrics(lyrics);
      const index = syncLyrics(lyrics, globalSeek);
      setDisplayedLyricsIndex(index);
      if (index === null) return;
      setDisplayedLyrics(lyrics[index].text);
    }
  };

  const updateLyricsIndex = () => {

  }

  // useEffect(() => {
  //   setLrcContent('')
  // }, [selectedAlbum, selectedTrack])

  useEffect(() => {
    if (globalSeek === 0) {
      setDisplayedLyrics("");
    }
    if(currentLyrics){
      const index = syncLyrics(currentLyrics, globalSeek);
      setDisplayedLyricsIndex(index);
      if(index === null) return;
      setDisplayedLyrics(currentLyrics[index].text)
    }

  }, [globalSeek, currentLyrics]);

  useEffect(() => {
    if (lrcContent) {
      displayCurrentLyrics();
    }
  }, [lrcContent])

  useEffect(() => {
    if(currentLyrics.length){
      setLyricsLoading(false)
    }
  }, [currentLyrics])

  const goToLyricsPosition = (position) => {
    if (Transport.state === "started") {
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
    <div className="lyricsWrapper" style={{ width: isTabletOrMobile ? "100%" : "25rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", marginLeft: isTabletOrMobile ? 0 : 0 }}>
      {lyricsLoading ? (
        <LoadingSpinner />
      ) : !noTrackLrc ? (
        <div>      
        <div ref={lyricsRef} className="lyricsdisplay" style={{ width: "100%", overflowY: 'scroll', scrollbarWidth: 'none' }}>
          {currentLyrics.map((line, index) => {
            return (
              <div key={index}>
                <OneLine
                  line={line}
                  key={index}
                  index={index}
                  goToLyricsPosition={goToLyricsPosition}
                  displayedLyricsIndex={displayedLyricsIndex}
                  isBigScreen={isBigScreen}
                  isDesktopOrLaptop={isDesktopOrLaptop}
                  isTabletOrMobile={isTabletOrMobile}
                />
              </div>
            );
          })}
        </div>
        {!currentLrc.fullySynced ? (
          <Link to={`/lyricseditor?albumId=${selectedAlbum}&songId=${selectedSong}&trackId=${selectedTrack}`}>
            <p style={{ textDecoration: "underline", margin: 0.5, color: 'whitesmoke' }}>Lyrics are not synced completely yet.</p>
          </Link>
        ) : null}
        </div>
      ) : <div
      style={{
        width: isTabletOrMobile ? "100%" : "25rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 10,
        height: 400,
      }}
    >
      <p style={{ fontSize: "1.25rem" }}>
        No Lyrics for this track found
      </p>
      <Link
        to={`/lyricseditor?albumId=${selectedAlbum}&songId=${selectedSong}&trackId=${selectedTrack}`}
      >
        <button>Add Lyrics</button>
      </Link>
    </div> }

    </div>
  );
};

export default Lyrics;
