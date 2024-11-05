// src/utils/base64.js
export const encodeBase64 = (text) => Buffer.from(text.toString()).toString("base64");
export const decodeBase64 = (encodedText) => Buffer.from(encodedText, "base64").toString("utf-8");
