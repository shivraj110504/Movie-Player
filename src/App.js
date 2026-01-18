import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSkipIndicator, setShowSkipIndicator] = useState(null);
  const [useIframe, setUseIframe] = useState(true);
  const videoRef = useRef(null);
  const lastTapTime = useRef(0);

  const FOLDER_ID = process.env.REACT_APP_FOLDER_ID || '18AWs95TmYiGv3ZaZ4yW62KLbymPwgB0U';
  const API_KEY = process.env.REACT_APP_GOOGLE_API || 'AIzaSyBR0rsD2dKFzI6lJOaX78vtzTPAw8TtrH8';

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,webContentLink)&key=${API_KEY}`
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
    
    loadMovies();
  }, [FOLDER_ID, API_KEY]);

  // Stream URL with proxy to avoid download prompts for large files
  const getStreamUrl = (fileId) => {
    // Using Google Drive's streaming endpoint that works for large files
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  };

  const getEmbedUrl = (fileId) => {
    // Fallback embed URL
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
    // Default to iframe for large files initially
    setUseIframe(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedMovie(null);
    setUseIframe(true);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const toggleFullscreen = () => {
    if (useIframe) {
      const iframe = videoRef.current;
      if (iframe && !document.fullscreenElement) {
        const container = iframe.parentElement;
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        }
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } else {
      const video = videoRef.current;
      if (video && !document.fullscreenElement) {
        const container = video.parentElement;
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        }
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const skipVideo = (seconds) => {
    if (useIframe) {
      // Show visual feedback for iframe (can't control playback)
      setShowSkipIndicator(seconds > 0 ? 'right' : 'left');
      setTimeout(() => setShowSkipIndicator(null), 500);
    } else {
      const video = videoRef.current;
      if (video) {
        video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration));
        
        setShowSkipIndicator(seconds > 0 ? 'right' : 'left');
        setTimeout(() => setShowSkipIndicator(null), 500);
      }
    }
  };

  const handleSkipBackward = () => {
    skipVideo(-10);
  };

  const handleSkipForward = () => {
    skipVideo(10);
  };

  const handleDoubleTap = (e, side) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime.current;

    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
      
      const skipSeconds = side === 'left' ? -10 : 10;
      skipVideo(skipSeconds);
    }
    lastTapTime.current = currentTime;
  };

  const switchToDirectPlayer = () => {
    setUseIframe(false);
  };

  const switchToIframePlayer = () => {
    setUseIframe(true);
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
            backgroundColor: '#111',
            flexWrap: 'wrap'
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
            {useIframe ? (
              <button 
                onClick={switchToDirectPlayer}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#e50914',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                🎮 Enable Skip Controls
              </button>
            ) : (
              <button 
                onClick={switchToIframePlayer}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                📺 Standard Player
              </button>
            )}
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
              {!useIframe && (
                <>
                  {/* Left tap area */}
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
                  
                  {/* Right tap area */}
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
                </>
              )}

              {showSkipIndicator === 'left' && (
                <div style={{
                  position: 'absolute',
                  left: '20%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '50%',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: '28px' }}>⏪</div>
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
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '50%',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: '28px' }}>⏩</div>
                  <div>10 sec</div>
                </div>
              )}

              {useIframe ? (
                <iframe
                  ref={videoRef}
                  src={getEmbedUrl(selectedMovie.id)}
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
              ) : (
                <video
                  ref={videoRef}
                  src={getStreamUrl(selectedMovie.id)}
                  controls
                  controlsList="nodownload"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000'
                  }}
                  onError={(e) => {
                    console.error('Video load error:', e);
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
            
            {/* Skip Controls - only show in direct player mode */}
            {!useIframe && (
              <div style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
                marginTop: '15px'
              }}>
                <button
                  onClick={handleSkipBackward}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#e50914',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(229, 9, 20, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f40612';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#e50914';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>⏪</span>
                  <span>10s Back</span>
                </button>
                
                <button
                  onClick={handleSkipForward}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#e50914',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(229, 9, 20, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f40612';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#e50914';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span>10s Forward</span>
                  <span style={{ fontSize: '20px' }}>⏩</span>
                </button>
              </div>
            )}

            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#999'
            }}>
              {useIframe ? (
                <>
                  <p style={{ margin: '5px 0' }}>📺 Standard streaming mode - works best for large files (2-5GB)</p>
                  <p style={{ margin: '5px 0' }}>🎮 Click "Enable Skip Controls" button to enable double-tap skip feature</p>
                  <p style={{ margin: '5px 0' }}>💡 Use Google Drive player's built-in controls to seek</p>
                </>
              ) : (
                <>
                  <p style={{ margin: '5px 0' }}>✨ Skip controls enabled!</p>
                  <p style={{ margin: '5px 0' }}>💡 Double-tap left/right side of video to skip 10 seconds</p>
                  <p style={{ margin: '5px 0' }}>📱 Use skip buttons below for precise control</p>
                  <p style={{ margin: '5px 0', color: '#ff9800' }}>⚠️ Note: Large files may take time to load in this mode</p>
                </>
              )}
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