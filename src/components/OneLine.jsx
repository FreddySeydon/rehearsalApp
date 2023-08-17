import React from "react";
import { useState, useEffect } from "react";

const OneLine = ({ line, index, displayedLyricsIndex, goToLyricsPosition, isBigScreen, isDesktopOrLaptop, isTabletOrMobile}) => {
  const testbool = true;
  const [lineActive, setLineActive] = useState(false);

  useEffect(() => {
    if (displayedLyricsIndex == null) {
      setLineActive(false);
      return;
    }
    if (displayedLyricsIndex == index) {
      setLineActive(true);
      return;
    }
    setLineActive(false);
  }, [displayedLyricsIndex]);

  return (
    <div style={{width: isTabletOrMobile ? "100%" : "25rem" }}>
      <a
        onClick={() => goToLyricsPosition(line.time)}
        style={{
          // paddingRight: "1rem",
          // paddingLeft: "1rem",
          margin: "1rem",
          cursor: "pointer",
          fontSize: isTabletOrMobile ? "2rem" : "1.5rem",
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
