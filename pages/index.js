import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async (file) => {
    setStatus("上传中...");
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "请求失败");
      }

      setResult(data);
      setStatus("完成");
    } catch (e) {
      setError(e.message);
      setStatus("失败");
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h2>雅思阅读精析生成器</h2>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => handleUpload(e.target.files[0])}
      />

      <p>状态：{status}</p>

      {error && <p style={{ color: "red" }}>错误：{error}</p>}

      {result && (
        <pre
          style={{
            background: "#f5f5f5",
            padding: 20,
            marginTop: 20,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
