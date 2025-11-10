import React from 'react';

function NewZealandVideo() {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: '1rem',
    boxSizing: 'border-box',
  };

  const iframeStyle: React.CSSProperties = {
    border: "none",
    width: "100%",
    maxWidth: "1080px",
    aspectRatio: "3 / 1",
    minHeight: "200px",
  };

  return (
    <div style={containerStyle}>
      <iframe
        src="https://player.vimeo.com/video/1090882752"
        allow="autoplay; fullscreen; picture-in-picture"
        style={iframeStyle}
        allowFullScreen
        title="New Zealand Video"
      ></iframe>
    </div>
  );
}

export default NewZealandVideo;
