import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../assets/img/logo.svg';
import './Navbar.css';
import { useMediaQuery } from 'react-responsive';

const Navbar = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [albumId, setAlbumId] = useState('');
  const [songId, setSongId] = useState('');
  const [trackId, setTrackId] = useState('');
  const [paramsSet, setParamsSet] = useState(false);
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
  const [menuOpen, setMenuOpen] = useState(false);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('albumId')) {
      setAlbumId(searchParams.get('albumId'));
    }
    if (searchParams.get('songId')) {
      setSongId(searchParams.get('songId'));
    }
    if (searchParams.get('trackId')) {
      setTrackId(searchParams.get('trackId'));
    }
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen) {
        // setMenuOpen(false);
      }
    };
    document.body.addEventListener('click', handleClickOutside);
    return () => {
      document.body.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (albumId && songId && trackId) {
      setParamsSet(true);
    }
  }, [albumId, songId, trackId]);

  const handleLogout = async () => {
    await signOut(auth);
    setMenuOpen(false);
    navigate('/?status=logged-out');
    console.log('logged out');
  };

  if (isTabletOrMobile) {
    return (
      <>
        <nav className="navbar glassCard" style={{ flexDirection: 'column', alignItems: 'center', marginBottom: 10, width: '95%' }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
            <img src={Logo} alt="" width={60} height={60} style={{ borderRadius: 10 }} />
            <h2 style={{ margin: 0 }}>Chord Chaos</h2>
            {user ? (
              <button
                style={{ fontSize: 'xx-large', backgroundColor: 'transparent', color: 'white', marginRight: 0, marginTop: 0, marginBottom: 0, padding: 0, marginLeft: menuOpen ? 12 : 0, outlineColor: 'transparent', borderColor: 'transparent', outline: 'none' }}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? '𝖷' : '☰'}
              </button>
            ) : (
              <Link to="/login?mode=login">
                <button className='glass'>Login</button>
              </Link>
            )}
          </div>
          {menuOpen ? (
            <div className="navbuttons glass" style={{ width: '100%', marginTop: 10, marginRight: 10, paddingTop: 15, paddingBottom: 15 }}>
              {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, justifyContent: 'center', alignItems: 'center', fontSize: 'large', width: '90%' }}>
                  <Link onClick={() => setMenuOpen(false)} to="/albums" style={{ color: '#b173cc', fontSize: 'xx-large', width: '100%' }}>
                    <button className='glass' style={{ fontSize: 'large', width: '100%' }}>Albums</button>
                  </Link>
                  <Link onClick={() => setMenuOpen(false)} to={paramsSet ? `/lyricseditor?albumId=${albumId}&songId=${songId}&trackId=${trackId}` : '/lyricseditor'} style={{ color: '#b173cc', fontSize: 'xx-large', width: '100%' }}>
                    <button className='glass' style={{ fontSize: 'large', width: '100%' }}>Lyrics Editor</button>
                  </Link>
                  <Link onClick={() => setMenuOpen(false)} to={paramsSet ? `/player?albumId=${albumId}&songId=${songId}&trackId=${trackId}` : '/player'} style={{ color: '#b173cc', fontSize: 'xx-large', width: '100%' }}>
                    <button className='glass' style={{ fontSize: 'large', width: '100%' }}>Player</button>
                  </Link>
                  <button onClick={handleLogout} className='glassCard' style={{ fontSize: 'large', width: '100%', marginTop: 10 }}>Logout</button>
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>
      </>
    );
  }

  return (
    <>
      <nav className="navbar glassCard" style={{ alignItems: 'center', marginBottom: 10, width: '100%' }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          <img src={Logo} alt="" width={60} height={60} style={{ borderRadius: 10 }} />
          <h2 style={{ margin: 0 }}>Chord Chaos</h2>
        </div>
        <div className="navbuttons" style={{ gap: 15 }}>
          {user ? (
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'center', fontSize: 'large' }}>
              <Link to="/albums">
                Albums
              </Link>
              <Link to={paramsSet ? `/lyricseditor?albumId=${albumId}&songId=${songId}&trackId=${trackId}` : '/lyricseditor'}>
                Lyrics Editor
              </Link>
              <Link to={paramsSet ? `/player?albumId=${albumId}&songId=${songId}&trackId=${trackId}` : '/player'}>
                Player
              </Link>
              <button onClick={handleLogout} className='glass' style={{ fontSize: 'medium' }}>Logout</button>
            </div>
          ) : (
            <Link to="/login?mode=login">
              <button className='glass'>Login</button>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
