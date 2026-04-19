export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from "formidable";
import fs from "fs";

// 提取JSON（防Claude乱输出）
function extractJSON(text) {
  if (!text) return null;

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1) return null;

  let json = text.slice(start, end + 1);

  const open = (json.match(/{/g) || []).length;
  const close = (json.match(/}/g) || []).length;

  if (open > close) {
    json += "}".repeat(open - close);
  }

  return json;
}

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    try {
      const file = files.file;

      const buffer = fs.readFileSync(file.filepath);
      const base64 = buffer.toString("base64");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          temperature: 0,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: base64,
                  },
                },
                {
                  type: "text",
                  text: "只返回JSON，不要任何解释",
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();

      const raw =
        data.content?.map((c) => c.text || "").join("") || "";

      const jsonStr = extractJSON(raw);

      if (!jsonStr) {
        throw new Error("Claude返回格式错误");
      }

      const parsed = JSON.parse(jsonStr);

      res.status(200).json(parsed);
    } catch (e) {
      res.status(500).json({
        error: e.message || "服务器错误",
      });
    }
  });
}
