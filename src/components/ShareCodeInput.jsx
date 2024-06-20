import React, { useState } from 'react';
import './FileUpload.css'
import { Link } from 'react-router-dom';
import LoadingSpinner from '../assets/img/loading.gif'

const ShareCodeInput = ({user}) => {
  const [sharecode, setSharecode] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [startedAdding, setStartedAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const server = import.meta.env.VITE_SERVER_ADDRESS

  const handleInputChange = (e) => {
    setSharecode(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setStartedAdding(true);
        const idToken = await user.getIdToken();
      const response = await fetch(`${server}/sharecode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ sharecode })
      });

      // if (!response.ok) {
      //   throw new Error('There was an error, please try again');
      // }

      const data = await response.json();
      setResponseMessage(data.message);
      setStartedAdding(false)
      if(response.ok && data.result === 'success'){
        setAdded(true)
      }
    } catch (error) {
      if(error.message === 'Unexpected end of JSON input'){
        setResponseMessage('There was an error. Please try again later.')
        setStartedAdding(false)
        setAdded(false);
        return
      }
      setResponseMessage(error.message);
      setStartedAdding(false);
      setAdded(false);
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      {!added ?       
      <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        <input
          type="text"
          value={sharecode}
          onChange={handleInputChange}
          placeholder="Enter Share Code"
          required
          className='glasstransparent'
          style={{height: 50, textAlign: 'center', fontSize: 'large', fontWeight: 'bold', color: "whitesmoke", outlineColor: "#fdc873"}}
        />
      {responseMessage && <p style={{margin: 0.5, color: "#fdc873"}}>{responseMessage}</p>}
        <button type="submit" className='glass' disabled={startedAdding}>{startedAdding ? <img src={LoadingSpinner} alt="Loading" width={20} /> : "Submit"}</button>
      </form> : <div><p>Album added successfully</p><Link to='/player'><button className='glass'>Start now</button></Link></div>
    }
    </div>
  );
};

export default ShareCodeInput;
