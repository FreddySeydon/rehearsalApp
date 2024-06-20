import React from "react";
import { useState, useEffect, useRef } from "react";

const OneLine = ({ line, index, displayedLyricsIndex, goToLyricsPosition, isBigScreen, isDesktopOrLaptop, isTabletOrMobile}) => {
  const [lineActive, setLineActive] = useState(false);
  const lineRef = useRef()

  useEffect(() => {
    if (displayedLyricsIndex == null) {
      setLineActive(false);
      return;
    }
    if (displayedLyricsIndex == index) {
      setLineActive(true);
      lineRef.current.scrollIntoView({behavior:"smooth", block:"center", inline:"center"})
      return;
    }
    setLineActive(false);
  }, [displayedLyricsIndex]);

  return (
    <div ref={lineRef} >
      <a
        onClick={() => goToLyricsPosition(line.time)}
        style={{
          // paddingRight: "1rem",
          // paddingLeft: "1rem",
          margin: "1rem",
          cursor: "pointer",
          fontSize: isTabletOrMobile ? "1.5rem" : "1.5rem",
          fontWeight: lineActive ? "bold" : "normal",
          color: lineActive ? "#fdc873" : "white",
        }}
      >
        {line.text}
      </a>
    </div>
  );
};

export default OneLine;
