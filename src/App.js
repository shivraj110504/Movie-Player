import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSkipIndicator, setShowSkipIndicator] = useState(null);
  const lastTapTime = useRef(0);
  const lastTapSide = useRef(null);
  const iframeRef = useRef(null);

  const FOLDER_ID = process.env.REACT_APP_FOLDER_ID;
  const API_KEY = process.env.REACT_APP_GOOGLE_API;

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size)&key=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Could not load movies');
      }
      
      const data = await response.json();
      
      if (data.files) {
        const videoFiles = data.files.filter(file => 
          file.mimeType && (
            file.mimeType.startsWith('video/') ||
            file.name.match(/\.(mp4|mkv|avi|mov|webm|flv)$/i)
          )
        );
        setMovies(videoFiles);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load movies. Make sure the Google Drive folder is public.');
      setLoading(false);
    }
  };

  const getStreamLink = (fileId) => {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedMovie(null);
  };

  const handleRefresh = () => {
    loadMovies();
  };

  const toggleFullscreen = () => {
    const elem = document.querySelector('iframe');
    if (elem && !document.fullscreenElement) {
      const container = elem.parentElement;
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleDoubleTap = (e, side) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime.current;

    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
      
      setShowSkipIndicator(side);
      setTimeout(() => setShowSkipIndicator(null), 800);
    }
    lastTapTime.current = currentTime;
    lastTapSide.current = side;
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: '#000',
        minHeight: '100vh',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p>Loading movies...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '100%', 
      margin: '0 auto',
      backgroundColor: '#000',
      minHeight: '100vh',
      color: '#fff'
    }}>
      {selectedMovie ? (
        <div>
          <div style={{
            display: 'flex',
            gap: '10px',
            padding: '10px',
            backgroundColor: '#111'
          }}>
            <button 
              onClick={handleBack}
              style={{
                padding: '10px 16px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
            <button 
              onClick={toggleFullscreen}
              style={{
                padding: '10px 16px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ⛶ Fullscreen
            </button>
          </div>
          
          <div style={{ padding: '10px' }}>
            <h2 style={{ margin: '10px 0', fontSize: '16px' }}>
              {selectedMovie.name}
              {selectedMovie.size && (
                <span style={{ fontSize: '12px', color: '#999', marginLeft: '10px' }}>
                  ({formatFileSize(selectedMovie.size)})
                </span>
              )}
            </h2>
            <div style={{ 
              position: 'relative',
              paddingBottom: '56.25%',
              height: 0,
              overflow: 'hidden',
              backgroundColor: '#000'
            }}>
              <div
                onClick={(e) => handleDoubleTap(e, 'left')}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '40%',
                  height: '100%',
                  zIndex: 10,
                  cursor: 'pointer'
                }}
              />
              
              <div
                onClick={(e) => handleDoubleTap(e, 'right')}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  width: '40%',
                  height: '100%',
                  zIndex: 10,
                  cursor: 'pointer'
                }}
              />

              {showSkipIndicator === 'left' && (
                <div style={{
                  position: 'absolute',
                  left: '20%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: '50%',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: '24px' }}>⏪</div>
                  <div>10 sec</div>
                </div>
              )}

              {showSkipIndicator === 'right' && (
                <div style={{
                  position: 'absolute',
                  right: '20%',
                  top: '50%',
                  transform: 'translate(50%, -50%)',
                  zIndex: 20,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: '50%',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: '24px' }}>⏩</div>
                  <div>10 sec</div>
                </div>
              )}

              <iframe
                ref={iframeRef}
                src={getStreamLink(selectedMovie.id)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={selectedMovie.name}
              />
            </div>
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#999'
            }}>
              <p style={{ margin: '5px 0' }}>💡 Double-tap left side to go back 10 seconds</p>
              <p style={{ margin: '5px 0' }}>💡 Double-tap right side to skip forward 10 seconds</p>
              <p style={{ margin: '5px 0' }}>📱 On mobile: Use the player's built-in controls to seek</p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Rest of the code remains the same */}
        </div>
      )}
    </div>
  );
}

export default App;