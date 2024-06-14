import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, updateProfile, onAuthStateChanged } from 'firebase/auth';
import "../App.css";
import loadingSpinner from '../assets/img/loading.gif';
import Navbar from './Navbar';

const Login = ({mode, setMode}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);

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

  const handleLogin = async () => {
    setError('')
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const handleSignUp = async () => {
    setError('')
    if(!displayName){
      setInfo('You have to set a name to sign up')
      return
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
      setUser(userCredential.user);
    } catch (error) {
      console.error('Error registering:', error);
      setError(`Error registering: ${error}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
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
      setUser(result.user);
    } catch (error) {
      console.error('Error with Google Sign-In:', error);
      setError(`Error with Google Sign-In: ${error}`);
    }
  };

  if(loading){
    return <div><h1>Welcome to Rehearsal Rocket</h1><img src={loadingSpinner} alt="Loading" width={50} /></div>
  }

  return (
    <>
    <div style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
    <h1>Welcome to Rehearsal Rocket</h1>
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
      {error ? <p>{error}</p> : null }
      {info ? <p>{info}</p> : null }
      <div style={{display: 'flex', flexDirection: "column", gap: 5, marginTop: 10}}>
      {mode === 'login' ? 
      <div style={{display: "flex", flexDirection: "column"}}>
        <button onClick={handleLogin} className='glass'>Login</button> 
        <a onClick={() => setMode('signup')} style={{marginTop: 10, textDecoration: "underline", cursor: "pointer"}}>Don't have an accout? Sign up for free!</a> 
        </div>
        :
       <div style={{display: "flex", flexDirection: "column"}}>
         <button onClick={handleSignUp} className='glass'>Sign Up</button>
         <a onClick={() => setMode('login')} style={{marginTop: 10, textDecoration: "underline", cursor: "pointer"}}>Already have an account? Log in!</a> 
       </div>
       
       }
      <h2>or</h2>
      <button onClick={handleGoogleSignIn} className='glass'>Sign in with Google</button>
      </div>
    </div>)
    }
    </div>
    </>
  );
};

export default Login;
