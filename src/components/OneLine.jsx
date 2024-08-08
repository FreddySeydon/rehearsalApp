import React from "react";
import { useState, useEffect, useRef } from "react";

function getScrollParent(node) {
  if (node == null) {
    return null;
  }

  if (node.scrollHeight > node.clientHeight) {
    return node;
  } else {
    return getScrollParent(node.parentNode);
  }
}

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
      // implement "scrollIntoView" manually to ensure that only the lyrics container scrolls
      const scrollableContainer = getScrollParent(lineRef.current);
      if (scrollableContainer) {
        const scrollPositionFactor = 0.3; // use 0.5 for vertical centering, but it makes sense to give a bit more space to the upcoming lines
        const availableHeight = scrollableContainer.offsetHeight - lineRef.current.offsetHeight;
        const scrollTarget = lineRef.current.offsetTop - scrollableContainer.offsetTop - availableHeight * scrollPositionFactor;
        scrollableContainer.scrollTo({
          top: scrollTarget,
          behavior: "smooth",
        });
      }
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
