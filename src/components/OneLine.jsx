import React from "react";
import { useState, useEffect } from "react";

const OneLine = ({ line, index, displayedLyricsIndex, goToLyricsPosition }) => {
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
    <div>
      <a
        onClick={() => goToLyricsPosition(line.time)}
        style={{
          cursor: "pointer",
          fontSize: "1.5rem",
          fontWeight: lineActive ? "bold" : "normal",
        }}
      >
        {line.text}
      </a>
    </div>
  );
};

export default OneLine;
