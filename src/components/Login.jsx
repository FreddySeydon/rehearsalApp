import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, updateProfile, onAuthStateChanged, signInWithRedirect } from 'firebase/auth';
import "../App.css";
import loadingSpinner from '../assets/img/loading.gif';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import GoogleSignInIcon from '../assets/img/googlesignin.svg'
import { useMediaQuery } from 'react-responsive';

const Login = ({mode, setMode}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    navigate('/player')
  }, [user])

  const handleLogin = async () => {
    setError('')
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (error) {
      console.error('Error logging in:', error);
      switch (error.code){
        case 'auth/user-disabled':
          setError('Your account has been disabled.');
          setUser(null);
          break;
        case 'auth/email-already-in-use':
          setError('This Email Address is already in use');
          setUser(null);
          break;
        default:
          setError(`There was an error logging you in. Please try again`);
          setUser(null);

      }
    }
  };

  const handleSignUp = async () => {
    setError('')
    setInfo('')
    if(!displayName){
      setInfo('You have to set a name to sign up')
      return
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
      currentUser = userCredential.user;
      
      //Create user document in Firestore
      await setDoc(doc(db, "users", currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: displayName,
      });
      
      setUser(currentUser);

    } catch (error) {
      console.error('Error registering:', error.code);
      switch (error.code){
        case 'auth/user-disabled':
          setError('Your account has been disabled.');
          setUser(null);
          break;
        case 'auth/email-already-in-use':
          setError('This Email Address is already in use');
          setUser(null);
          break;
        default:
          setError(`There was an error signing up. Please try again`);
          setUser(null);

      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleGoogleSignIn = async () => {
    setError('')
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.displayName == null) {
        await updateProfile(result.user, {
          displayName: result.user.email.split('@')[0], // Set a default display name based on email if there is none
        });
      }
      const currentUser = result.user;
      
      //Check Firestore if user document exists
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if(!userDoc.exists()){
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
        })
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Error with Google Sign-In:', error);
      setError(`There was an error signing you in with Google. Please try again. ${error}`);
    }
  };

  if(loading){
    return <div><p style={{margin:0, fontSize: "xx-large"}}>Welcome to</p>
    <h1 style={{marginTop: 0}}>Chord Chaos</h1>
    <img src={loadingSpinner} alt="Loading" width={50} />
    </div>
  }

  return (
    <>
    <div style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
    <p style={{margin:0, fontSize: "xx-large"}}>Welcome to</p>
    <h1 style={{marginTop: 0}}>Chord Chaos</h1>
    {user ? ( <div> <Navbar /> <h2> Welcome, {user.displayName} </h2> <button onClick={handleLogout} className='glass'>Logout</button></div> ) : 
    (<div style={{display: 'flex', flexDirection: "column", gap: 10, padding: 15, height: "fit-content", width: 400}} className='glasstransparent'>
      <h2>{mode === 'login' ? "Login" : "Sign Up"}</h2>
      {mode === 'login' ? null : 
      <input
            type="text"
            placeholder="Name"
            onChange={(e) => setDisplayName(e.target.value)}
            value={displayName}
            className='glass'
        style={{height: 40, textAlign: 'center'}}
          />}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className='glass'
        style={{height: 40, textAlign: 'center'}}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className='glass'
        style={{height: 40, textAlign: 'center'}}
      />
      {error ? <p style={{margin: 0, color: '#fdc873'}}>{error}</p> : null }
      {info ? <p style={{margin: 0, color: '#fdc873'}}>{info}</p> : null }
      <div style={{display: 'flex', flexDirection: "column", justifyContent: 'center', alignItems:'center', gap: 5, marginTop: info || error ? 0 : 10, width: "100%"}}>
      {mode === 'login' ? 
      <div style={{display: "flex", flexDirection: "column", width: "100%"}}>
        <button onClick={handleLogin} className='glass' style={{width: "100%"}}>Login</button> 
        <a onClick={() => setMode('signup')} style={{marginTop: 10, textDecoration: "underline", cursor: "pointer"}}>Don't have an accout? Sign up for free!</a> 
        </div>
        :
       <div style={{display: "flex", flexDirection: "column", width: '100%'}}>
         <button onClick={handleSignUp} className='glass' style={{width: "100%"}}>Sign Up</button>
         <a onClick={() => setMode('login')} style={{marginTop: 10, textDecoration: "underline", cursor: "pointer"}}>Already have an account? Log in!</a> 
       </div>
       
       }
      <p style={{margin: 0, fontSize: "x-large", fontWeight: "bold"}}>or</p>
      <button onClick={handleGoogleSignIn} style={{backgroundColor: 'transparent', margin: 0, width: 200, padding: 0, outlineColor: 'transparent', borderColor: "transparent"}}><img src={GoogleSignInIcon} alt="Sign in with Google" width={200} /></button>
      </div>
    </div>)
    }
    </div>
    </>
  );
};

export default Login;
