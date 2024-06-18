import React, { useState } from 'react';

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

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setResponseMessage(data);
    } catch (error) {
      setResponseMessage(error.message);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={sharecode}
          onChange={handleInputChange}
          placeholder="Enter share code"
          required
        />
        <button type="submit">Submit</button>
      </form>
      {responseMessage && <p>{responseMessage}</p>}
    </div>
  );
};

export default ShareCodeInput;
