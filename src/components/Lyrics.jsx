import React from 'react';
import {useState, useEffect} from 'react';
import { parseLyrics, syncLyrics } from '../../utils/lrcParser';
import "./Lyrics.css"

const Lyrics = ({sounds, selectedTrack, setLrcContent, lrcContent, setLoading, loading, globalSeek, setGlobalSeek, setUserSeek, userSeek}) => {
    const [displayedLyrics, setDisplayedLyrics] = useState("")
    const [currentLyrics, setCurrentLyrics] = useState([])
    useEffect(() => {
        const loadLrc = async () => {
          setLoading(true)
          const lrcLocation = sounds[selectedTrack][0].lrc
          const res = await fetch(lrcLocation);
          const lrc = await res.text();
          setLrcContent(lrc);
          setLoading(false)
        }
        loadLrc();
      }, [])

    const displayCurrentLyrics = () => {
        const lyrics = parseLyrics(lrcContent);
        setCurrentLyrics(lyrics);
        const index = syncLyrics(lyrics, globalSeek);
        if(index == null) return;
        setDisplayedLyrics(lyrics[index].text);

    }

    useEffect(() => {
        if(globalSeek == 0){
            setDisplayedLyrics("")
        }
        if(!loading){
            displayCurrentLyrics();
        } return
        
    }, [globalSeek]);


    const goToLyricsPosition = (position) => {
        setGlobalSeek(position);
        setUserSeek(!userSeek);
    }
    const testbool = true
    //   loading ? null : 
  return (
    <div className="lyricsWrapper">
        {loading ? <div>Loading...</div> : <div>{displayedLyrics}</div>}
        <div className="lyricsdisplay">
            Full Lyrics
            {currentLyrics.map((line, index) => {
                return <div><a onClick={() => goToLyricsPosition(line.time)} style={{cursor: 'pointer', fontSize: testbool ? "1.5rem" : "5rem", fontWeight:'bold'}}>{line.text}</a> <br/></div>
            })}
        </div>
    </div>
  )
}

export default Lyrics
