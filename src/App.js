import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSkipIndicator, setShowSkipIndicator] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const lastTapTime = useRef(0);

  const FOLDER_ID = process.env.REACT_APP_FOLDER_ID || '18AWs95TmYiGv3ZaZ4yW62KLbymPwgB0U';
  const API_KEY = process.env.REACT_APP_GOOGLE_API || 'AIzaSyBR0rsD2dKFzI6lJOaX78vtzTPAw8TtrH8';

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
        throw new Error('Could not load movies. Make sure the folder is public.');
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
      setError('Failed to load movies. Please make sure the Google Drive folder is set to "Anyone with the link can view".');
      setLoading(false);
    }
  };

  const getDirectStreamLink = (fileId) => {
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
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
    setIsPlaying(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedMovie(null);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleRefresh = () => {
    loadMovies();
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        const container = videoRef.current.parentElement;
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  };

  const skipVideo = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleDoubleTap = (e, side) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime.current;

    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
      
      const skipSeconds = side === 'left' ? -10 : 10;
      skipVideo(skipSeconds);
      
      setShowSkipIndicator(side);
      setTimeout(() => setShowSkipIndicator(null), 800);
    }
    lastTapTime.current = currentTime;
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
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
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

              <video
                ref={videoRef}
                src={getDirectStreamLink(selectedMovie.id)}
                controls
                controlsList="nodownload"
                preload="metadata"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#000'
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
              >
                Your browser does not support video playback.
              </video>
            </div>
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#999'
            }}>
              <p style={{ margin: '5px 0' }}>💡 Double-tap left side to rewind 10 seconds</p>
              <p style={{ margin: '5px 0' }}>💡 Double-tap right side to skip forward 10 seconds</p>
              <p style={{ margin: '5px 0' }}>📱 Streams in chunks - starts playing instantly!</p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 15px',
            borderBottom: '1px solid #333',
            backgroundColor: '#111'
          }}>
            <h1 style={{ margin: 0, fontSize: '18px' }}>Movies</h1>
            <button 
              onClick={handleRefresh}
              style={{
                padding: '6px 12px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ↻ Refresh
            </button>
          </div>
          
          {error ? (
            <div style={{ padding: '20px' }}>
              <p style={{ color: '#ff6b6b', fontSize: '14px' }}>{error}</p>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                To fix: Go to Google Drive → Right-click folder → Share → Change to "Anyone with the link"
              </p>
            </div>
          ) : movies.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px' }}>No movies found.</p>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                Upload videos to your Google Drive folder and click Refresh.
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '12px',
              padding: '12px'
            }}>
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => handleMovieClick(movie)}
                  style={{
                    backgroundColor: '#1a1a1a',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: '1px solid #333'
                  }}
                >
                  <div style={{
                    width: '100%',
                    paddingBottom: '150%',
                    backgroundColor: '#333',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      fontSize: '32px'
                    }}>▶</div>
                  </div>
                  <p style={{ 
                    margin: 0,
                    fontSize: '12px',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    lineHeight: '1.3'
                  }}>
                    {movie.name}
                  </p>
                  {movie.size && (
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '10px',
                      textAlign: 'center',
                      color: '#666'
                    }}>
                      {formatFileSize(movie.size)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;