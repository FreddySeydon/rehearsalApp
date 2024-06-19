import React, { useState } from 'react';
import './FileUpload.css'

const ShareCodeInput = ({user}) => {
  const [sharecode, setSharecode] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const server = import.meta.env.VITE_SERVER_ADDRESS

  const handleInputChange = (e) => {
    setSharecode(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
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
    } catch (error) {
      setResponseMessage(error.message);
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        <input
          type="text"
          value={sharecode}
          onChange={handleInputChange}
          placeholder="Enter share code"
          required
          className='glasstransparent'
          style={{height: 50, textAlign: 'center', fontSize: 'large', fontWeight: 'bold', color: "whitesmoke", outlineColor: "#fdc873"}}
        />
      {responseMessage && <p style={{margin: 0.5, color: "#fdc873"}}>{responseMessage}</p>}
        <button type="submit" className='glass'>Submit</button>
      </form>
    </div>
  );
};

export default ShareCodeInput;
