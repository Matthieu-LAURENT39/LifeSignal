"use client";
import { useRef, useState } from "react";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [blobId, setBlobId] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any>(null);
  const [downloadBlobId, setDownloadBlobId] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload using Walrus HTTP API (PUT, file as body)
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setTxId(null);
    setBlobId(null);
    setUploadResponse(null);
    try {
      const res = await fetch(
        "https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=5",
        {
          method: "PUT",
          body: selectedFile,
        }
      );
      if (!res.ok) throw new Error("Upload failed: " + res.statusText);
      const data = await res.json();
      setUploadResponse(data);
      // Extract blobId and tx info from response
      const blobId =
        data?.newlyCreated?.blobObject?.blobId ||
        data?.alreadyCertified?.blobId ||
        "";
      setBlobId(blobId);
      setTxId(
        data?.newlyCreated?.blobObject?.id ||
        data?.alreadyCertified?.event?.txDigest ||
        ""
      );
      if (!blobId) setError("No blobId returned from Walrus");
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Download using Walrus HTTP API (GET)
  const handleDownload = async () => {
    setError(null);
    setDownloadUrl(null);
    if (!downloadBlobId) return;
    try {
      const res = await fetch(
        `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${downloadBlobId}`
      );
      if (!res.ok) throw new Error("Download failed: " + res.statusText);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      // Optionally, trigger download immediately
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadBlobId;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (e: any) {
      setError(e.message || "Download failed");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Walrus Testnet File Uploader</h1>
      <div style={{ marginBottom: 24 }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={e => setSelectedFile(e.target.files?.[0] || null)}
          disabled={uploading}
        />
        <button onClick={handleUpload} disabled={!selectedFile || uploading} style={{ marginLeft: 8 }}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {txId && (
        <div style={{ marginBottom: 8 }}>
          <b>Transaction ID:</b> <code>{txId}</code>
        </div>
      )}
      {blobId && (
        <div style={{ marginBottom: 8 }}>
          <b>Blob Address:</b> <code>{blobId}</code>
        </div>
      )}
      {uploadResponse && (
        <div style={{ margin: "16px 0", padding: 12, background: "#f6f6f6", borderRadius: 6, fontSize: 13, color: "#222", wordBreak: "break-all" }}>
          <b>Full Upload Response:</b>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(uploadResponse, null, 2)}</pre>
        </div>
      )}
      <hr style={{ margin: "24px 0" }} />
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Enter blob address to download"
          value={downloadBlobId}
          onChange={e => setDownloadBlobId(e.target.value)}
          style={{ width: "70%" }}
        />
        <button onClick={handleDownload} disabled={!downloadBlobId} style={{ marginLeft: 8 }}>
          Download
        </button>
      </div>
      {downloadUrl && (
        <div style={{ marginBottom: 8 }}>
          <a href={downloadUrl} download>
            Click here to download your file
          </a>
        </div>
      )}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div style={{ marginTop: 32, fontSize: 12, color: '#888' }}>
        Powered by <a href="https://docs.wal.app/usage/web-api.html" target="_blank" rel="noopener noreferrer">Walrus HTTP API</a>
      </div>
    </div>
  );
}
