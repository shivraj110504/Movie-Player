import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

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
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
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
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
  };

  const handleRefresh = () => {
    loadMovies();
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        } else if (videoRef.current.webkitEnterFullscreen) {
          videoRef.current.webkitEnterFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
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
              <video
                ref={videoRef}
                src={getStreamLink(selectedMovie.id)}
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
                playsInline
                autoPlay
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
              <p style={{ margin: '5px 0' }}>💡 Tip: Video streams in chunks like YouTube - no need to wait for full download!</p>
              <p style={{ margin: '5px 0' }}>📱 On mobile: Tap fullscreen for best experience</p>
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
            </div>
          ) : movies.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px' }}>No movies found.</p>
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