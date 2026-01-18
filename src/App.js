import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSkipIndicator, setShowSkipIndicator] = useState(null);

  const videoRef = useRef(null);
  const lastTapTime = useRef(0);

  const FOLDER_ID =
    process.env.REACT_APP_FOLDER_ID ||
    "18AWs95TmYiGv3ZaZ4yW62KLbymPwgB0U";

  const API_KEY =
    process.env.REACT_APP_GOOGLE_API ||
    "AIzaSyBR0rsD2dKFzI6lJOaX78vtzTPAw8TtrH8";

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size)&key=${API_KEY}`
        );

        if (!res.ok) throw new Error("Failed to load");

        const data = await res.json();
        const videos = data.files.filter(
          (f) =>
            f.mimeType?.startsWith("video/") ||
            f.name.match(/\.(mp4|mkv|webm|mov)$/i)
        );

        setMovies(videos);
        setLoading(false);
      } catch (e) {
        setError("Make sure Drive folder is PUBLIC");
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  /** 🔑 Direct streamable link */
  const getStreamUrl = (id) =>
    `https://drive.google.com/uc?export=download&id=${id}`;

  const skipVideo = (seconds) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(
      0,
      Math.min(video.duration, video.currentTime + seconds)
    );
  };

  const handleDoubleTap = (e, side) => {
    const now = Date.now();
    const diff = now - lastTapTime.current;

    if (diff < 300) {
      e.preventDefault();
      const sec = side === "left" ? -10 : 10;
      skipVideo(sec);

      setShowSkipIndicator(side);
      setTimeout(() => setShowSkipIndicator(null), 700);
    }
    lastTapTime.current = now;
  };

  if (loading) {
    return (
      <div style={{ color: "#fff", textAlign: "center", padding: 40 }}>
        Loading movies...
      </div>
    );
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh", color: "#fff" }}>
      {selectedMovie ? (
        <>
          <button
            onClick={() => setSelectedMovie(null)}
            style={{ margin: 10 }}
          >
            ← Back
          </button>

          <h3 style={{ marginLeft: 10 }}>{selectedMovie.name}</h3>

          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 900,
              margin: "auto",
            }}
          >
            {/* LEFT TAP */}
            <div
              onClick={(e) => handleDoubleTap(e, "left")}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "40%",
                height: "85%",
                zIndex: 10,
              }}
            />

            {/* RIGHT TAP */}
            <div
              onClick={(e) => handleDoubleTap(e, "right")}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: "40%",
                height: "85%",
                zIndex: 10,
              }}
            />

            {/* SKIP UI */}
            {showSkipIndicator && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: showSkipIndicator === "left" ? "25%" : "75%",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(0,0,0,0.7)",
                  padding: 20,
                  borderRadius: "50%",
                  zIndex: 20,
                }}
              >
                {showSkipIndicator === "left" ? "⏪ 10s" : "⏩ 10s"}
              </div>
            )}

            <video
              ref={videoRef}
              src={getStreamUrl(selectedMovie.id)}
              controls
              autoPlay
              style={{ width: "100%", background: "#000" }}
            />
          </div>
        </>
      ) : (
        <div style={{ padding: 15 }}>
          <h2>Movies</h2>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {movies.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMovie(m)}
                style={{
                  background: "#111",
                  padding: 10,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    background: "#333",
                    height: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ▶
                </div>
                <p style={{ fontSize: 12, marginTop: 6 }}>{m.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
