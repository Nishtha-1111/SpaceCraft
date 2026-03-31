// import { useState } from "react";
// import axios from "axios";
// import "./App.css";

// function App() {
//   const [file, setFile] = useState(null);
//   const [preview, setPreview] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState("");

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     if (!selectedFile) return;

//     setFile(selectedFile);
//     setPreview(URL.createObjectURL(selectedFile));
//     setResult(null);
//     setError("");
//   };

//   const handleUpload = async () => {
//     if (!file) {
//       setError("Please select an image first.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       setLoading(true);
//       setError("");
//       setResult(null);

//       const response = await axios.post(
//         "http://127.0.0.1:8000/analyze-room",
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       setResult(response.data);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to analyze the room. Make sure backend is running.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="app">
//       <div className="background-glow glow-1"></div>
//       <div className="background-glow glow-2"></div>

//       <header className="hero">
//         <h1>Room Optimizer AI</h1>
//         <p>
//           Upload a room image and get object detection, room score, and smart
//           optimization suggestions.
//         </p>
//       </header>

//       <main className="main-grid">
//         <section className="card upload-card">
//           <h2>Upload Room Image</h2>

//           <label className="upload-box">
//             <input type="file" accept="image/*" onChange={handleFileChange} />
//             <span>Select an image</span>
//           </label>

//           {preview && (
//             <div className="preview-container">
//               <img src={preview} alt="Preview" className="preview-image" />
//             </div>
//           )}

//           <button onClick={handleUpload} disabled={loading} className="analyze-btn">
//             {loading ? "Analyzing..." : "Analyze Room"}
//           </button>

//           {error && <p className="error-text">{error}</p>}
//         </section>

//         <section className="card result-card">
//           <h2>Analysis Result</h2>

//           {!result && !loading && (
//             <p className="placeholder-text">
//               Upload an image to see room analysis here.
//             </p>
//           )}

//           {loading && <p className="placeholder-text">Processing your image...</p>}

//           {result && (
//             <div className="result-content">
//               <div className="score-box">
//                 <h3>Room Score</h3>
//                 <div
//                   className="score-circle"
//                   style={{ "--score": result.room_score }}
//                 >
//                   <div className="score-inner">{result.room_score}/100</div>
//                 </div>
//               </div>

//               {result.image_output_url && (
//                 <div className="section-block">
//                   <h3>Detected Image</h3>
//                   <div className="preview-container">
//                     <img
//                       src={result.image_output_url}
//                       alt="Detected output"
//                       className="preview-image"
//                     />
//                   </div>
//                 </div>
//               )}

//               <div className="section-block">
//                 <h3>Suggestions</h3>
//                 <ul>
//                   {result.suggestions.map((item, index) => (
//                     <li key={index}>{item}</li>
//                   ))}
//                 </ul>
//               </div>

//               <div className="section-block">
//                 <h3>Detected Objects</h3>
//                 <div className="detections-grid">
//                   {result.detections.map((item, index) => (
//                     <div key={index} className="detection-pill">
//                       <span className="label">{item.label}</span>
//                       <span className="confidence">
//                         {(item.confidence * 100).toFixed(1)}%
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}
//         </section>
//       </main>
//     </div>
//   );
// }

// export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;