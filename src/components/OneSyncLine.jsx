import React, {useRef, useState, useEffect} from 'react'
import { InputMask } from '@react-input/mask'
import { useMediaQuery } from 'react-responsive';

const OneSyncLine = ({index, line, timestamps, currentLineIndex, handleEditTimestamp, goToLyricsPosition}) => {
    const [lineActive, setLineActive] = useState(false);
    const lineRef = useRef()

    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
  
    useEffect(() => {
      if (currentLineIndex == null) {
        setLineActive(false);
        return;
      }
      if (currentLineIndex -1 == index) {
        console.log("Active: ", index, line)
        const yOffset = -20
        const element = document.getElementById(`line-${index}`)

        const y = element.getBoundingClientRect().top + yOffset
        console.log("y:",y)
        setLineActive(true);
        isTabletOrMobile ? window.scrollTo({top: y, behavior: 'smooth'}) : null
        lineRef.current.scrollIntoView({behavior:"smooth"})
        return;
      }
      setLineActive(false);
    }, [currentLineIndex]);

  return (
    <div id={`line-${index}`} className="line" ref={lineRef}  style={{
        // paddingRight: "1rem",
        // paddingLeft: "1rem",
        margin: "1rem",
        paddingTop: 5,
        // cursor: "pointer",
        fontSize: "1.5rem", //isTabletOrMobile ? "2rem" : "1.5rem"
        fontWeight: lineActive ? "bold" : "normal",
        color: lineActive ? "#fdc873" : "white",
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
  )
}

export default OneSyncLine
