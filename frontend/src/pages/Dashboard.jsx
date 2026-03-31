import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "room_optimizer");

  try {
    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dcstwu5hh/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Cloudinary upload error:", data);
      return null;
    }

    return data.secure_url || null;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    return null;
  }
};

function Dashboard() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const { currentUser, logout } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError("");
  };

  const fetchHistory = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "roomAnalyses"),
        where("uid", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);

      const items = querySnapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setHistory(items);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await axios.post(
        "http://127.0.0.1:8000/analyze-room",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const analysisResult = response.data;
      const imageUrl = await uploadToCloudinary(file);

      setResult({
        ...analysisResult,
        image_output_url: analysisResult.image_output_url || imageUrl || null,
      });

      if (currentUser) {
        const firestoreData = {
          uid: currentUser.uid,
          userEmail: currentUser.email,
          filename: file.name,
          detections: analysisResult.detections,
          roomScore: analysisResult.room_score,
          suggestions: analysisResult.suggestions,
          createdAt: serverTimestamp(),
        };

        if (imageUrl) {
          firestoreData.imageUrl = imageUrl;
        }

        await addDoc(collection(db, "roomAnalyses"), firestoreData);
      }

      fetchHistory();
    } catch (err) {
      console.error(err);
      setError("Failed to analyze the room. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleHistoryClick = (item) => {
    setResult({
      filename: item.filename,
      detections: item.detections,
      room_score: item.roomScore,
      suggestions: item.suggestions,
      image_output_url: item.imageUrl || null,
    });

    setPreview(item.imageUrl || null);
    setFile(null);
    setError("");
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "roomAnalyses", id));
      fetchHistory();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="app">
      <div className="background-glow glow-1"></div>
      <div className="background-glow glow-2"></div>

      <header className="hero">
        <div className="top-bar">
          <div className="hero-left">
            <span className="hero-badge">AI Room Analysis</span>
            <h1>Room Optimizer AI</h1>
            <p className="user-email">{currentUser?.email}</p>
          </div>

          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        <p className="hero-subtext">
          Upload a room image and get object detection, room score, and smart
          optimization suggestions.
        </p>
      </header>

      <main className="main-grid">
        <section className="card upload-card">
          <div className="card-heading">
            <h2>Upload Room Image</h2>
            <p>Select a clean room photo for better analysis.</p>
          </div>

          <label className="upload-box">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <div className="upload-content">
              <span className="upload-title">Choose an image</span>
              <span className="upload-subtitle">
                JPG, PNG or WEBP supported
              </span>
            </div>
          </label>

          {preview && (
            <div className="preview-container">
              <img src={preview} alt="Preview" className="preview-image" />
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={loading}
            className="analyze-btn"
          >
            {loading ? (
              <span className="btn-loader-wrap">
                <span className="loader"></span>
                Analyzing...
              </span>
            ) : (
              "Analyze Room"
            )}
          </button>

          {error && <p className="error-text">{error}</p>}
        </section>

        <section className="card result-card">
          <div className="card-heading">
            <h2>Analysis Result</h2>
            <p>Detected objects, room score, and layout suggestions.</p>
          </div>

          {!result && !loading && (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <p className="placeholder-text">
                Upload an image to see room analysis here.
              </p>
            </div>
          )}

          {loading && (
            <div className="empty-state">
              <div className="loader large-loader"></div>
              <p className="placeholder-text">Processing your image...</p>
            </div>
          )}

          {result && (
            <div className="result-content">
              <div className="score-box">
                <h3>Room Score</h3>
                <div
                  className="score-circle"
                  style={{ "--score": result.room_score }}
                >
                  <div className="score-inner">{result.room_score}/100</div>
                </div>
              </div>

              {result.image_output_url && (
                <div className="section-block">
                  <div className="section-title-row">
                    <h3>Detected / Uploaded Image</h3>
                  </div>
                  <div className="preview-container">
                    <img
                      src={result.image_output_url}
                      alt="Detected output"
                      className="preview-image"
                    />
                  </div>
                </div>
              )}

              <div className="section-block">
                <div className="section-title-row">
                  <h3>Room Summary</h3>
                </div>
                <p className="summary-text">
                  Detected {result.detections.length} objects. The current room
                  score is {result.room_score}/100.
                </p>
              </div>

              <div className="section-block">
                <div className="section-title-row">
                  <h3>Suggestions</h3>
                </div>
                <ul className="suggestion-list">
                  {result.suggestions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="section-block">
                <div className="section-title-row">
                  <h3>Detected Objects</h3>
                </div>
                <div className="detections-grid">
                  {result.detections
                    .filter((item) => item.confidence >= 0.35)
                    .map((item, index) => (
                      <div key={index} className="detection-pill">
                        <span className="label">{item.label}</span>
                        <span className="confidence">
                          {(item.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="section-block">
                <div className="section-title-row">
                  <h3>Previous Analyses</h3>
                  <span className="history-count">{history.length}</span>
                </div>

                {history.length === 0 ? (
                  <p className="placeholder-text">No previous analyses yet.</p>
                ) : (
                  <div className="history-grid">
                    {history.map((item) => (
                      <div key={item.id} className="history-wrapper">
                        <div
                          className="history-card clickable-history"
                          onClick={() => handleHistoryClick(item)}
                        >
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt="history"
                              className="history-image"
                            />
                          )}

                          <div className="history-content">
                            <h4>{item.filename}</h4>
                            <div className="history-meta">
                              <p>Score: {item.roomScore}/100</p>
                              <p>Objects: {item.detections?.length || 0}</p>
                            </div>

                            <div className="history-tags">
                              {(item.detections || [])
                                .filter((det) => det.confidence >= 0.35)
                                .slice(0, 4)
                                .map((det, idx) => (
                                  <span key={idx} className="mini-pill">
                                    {det.label}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>

                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;