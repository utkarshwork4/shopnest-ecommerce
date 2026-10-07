import React from 'react';

const About = () => {
  const containerStyle = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px',
    background: '#18181b',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    textAlign: 'center'
  };

  return (
    <div style={containerStyle}>
      <h2
        style={{
          fontSize: '2.5rem',
          marginBottom: '10px',
          color: '#fff'
        }}
      >
        About Me
      </h2>

      <h3
        style={{
          fontSize: '1.5rem',
          color: '#f97316',
          marginBottom: '15px'
        }}
      >
        Utkarsh Chaudhary
      </h3>

      <p
        style={{
          color: '#a1a1aa',
          fontSize: '1.2rem',
          lineHeight: '1.8',
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        <strong>
          Welcome to my platform where we build, deploy, and scale
          high-quality solutions.
        </strong>
      </p>
    </div>
  );
};

export default About;