import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSkipIndicator, setShowSkipIndicator] = useState(null);
  const iframeRef = useRef(null);
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

  const getEmbedUrl = (fileId) => {
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
    window.location.reload();
  };

  const toggleFullscreen = () => {
    const iframe = iframeRef.current;
    if (iframe && !document.fullscreenElement) {
      const container = iframe.parentElement;
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const skipVideo = (seconds) => {
    // Show visual feedback
    setShowSkipIndicator(seconds > 0 ? 'right' : 'left');
    setTimeout(() => setShowSkipIndicator(null), 800);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedMovie) return;
      
      // Left arrow key - skip backward
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipVideo(-10);
      }
      // Right arrow key - skip forward
      else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipVideo(10);
      }
      // J key - skip backward (YouTube style)
      else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        skipVideo(-10);
      }
      // L key - skip forward (YouTube style)
      else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        skipVideo(10);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedMovie]);

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
              backgroundColor: '#000',
              borderRadius: '8px'
            }}>
              {/* Left tap area */}
              <div
                onClick={(e) => handleDoubleTap(e, 'left')}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '35%',
                  height: '85%',
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
                  width: '35%',
                  height: '85%',
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
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '50%',
                  width: '90px',
                  height: '90px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  animation: 'skipPulse 0.8s ease-out'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '4px' }}>⏪</div>
                  <div style={{ fontSize: '13px' }}>10 sec</div>
                </div>
              )}

              {showSkipIndicator === 'right' && (
                <div style={{
                  position: 'absolute',
                  right: '20%',
                  top: '50%',
                  transform: 'translate(50%, -50%)',
                  zIndex: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '50%',
                  width: '90px',
                  height: '90px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  animation: 'skipPulse 0.8s ease-out'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '4px' }}>⏩</div>
                  <div style={{ fontSize: '13px' }}>10 sec</div>
                </div>
              )}

              <iframe
                ref={iframeRef}
                src={getEmbedUrl(selectedMovie.id)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px'
                }}
                allow="autoplay; fullscreen; picture-in-picture; accelerometer; gyroscope"
                allowFullScreen
                title={selectedMovie.name}
              />
            </div>
            
            {/* Skip Controls */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginTop: '20px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleSkipBackward}
                style={{
                  padding: '14px 28px',
                  backgroundColor: '#e50914',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(229, 9, 20, 0.4)',
                  transition: 'all 0.2s',
                  minWidth: '140px',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f40612';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(229, 9, 20, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#e50914';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(229, 9, 20, 0.4)';
                }}
              >
                <span style={{ fontSize: '22px' }}>⏪</span>
                <span>10s</span>
              </button>
              
              <button
                onClick={handleSkipForward}
                style={{
                  padding: '14px 28px',
                  backgroundColor: '#e50914',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(229, 9, 20, 0.4)',
                  transition: 'all 0.2s',
                  minWidth: '140px',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f40612';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(229, 9, 20, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#e50914';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(229, 9, 20, 0.4)';
                }}
              >
                <span>10s</span>
                <span style={{ fontSize: '22px' }}>⏩</span>
              </button>
            </div>

            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '8px',
              fontSize: '13px',
              color: '#aaa',
              lineHeight: '1.6'
            }}>
              <div style={{ marginBottom: '12px', fontSize: '14px', color: '#fff', fontWeight: '600' }}>
                ⚡ Quick Controls Guide
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#e50914', fontSize: '16px' }}>👆</span>
                  <span><strong>Double-tap</strong> left/right side of video to skip ±10 seconds</span>
                </p>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#e50914', fontSize: '16px' }}>⌨️</span>
                  <span><strong>Arrow keys</strong> or <strong>J/L keys</strong> to skip (YouTube style)</span>
                </p>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#e50914', fontSize: '16px' }}>🎮</span>
                  <span>Use skip buttons above for quick access</span>
                </p>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#e50914', fontSize: '16px' }}>🎬</span>
                  <span>Use Google Drive player controls inside video for play/pause/seek</span>
                </p>
              </div>
              <div style={{ 
                marginTop: '12px', 
                paddingTop: '12px', 
                borderTop: '1px solid #333',
                fontSize: '12px',
                color: '#666'
              }}>
                💡 Tip: The skip controls show visual feedback. Use the player's built-in seek bar for precise navigation.
              </div>
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
                    border: '1px solid #333',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#e50914';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.transform = 'translateY(0)';
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
                      fontSize: '32px',
                      color: '#e50914'
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
      
      <style>{`
        @keyframes skipPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default App;