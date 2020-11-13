const fs = require("fs");
const maxApi = require("max-api");
const parseDataUrl = require("parse-data-url");
const Websocket = require("ws");

const wsUrl = "wss://ws-fggq5.ondigitalocean.app";

// Establish Websocket connection

const ws = new Websocket(wsUrl);

// Keep websocket connection alive

const interval = setInterval(() => ws.ping(() => {}), 15 * 1000);
interval.unref();

maxApi.addHandler("subscribe", (channel, type, userId = null) => {
  maxApi.outlet("status", { status: "subscribed" });

  ws.on("message", (data) => {
    // Parse the message that can be text or a binary into a JSON

    const parsedData = safeJsonParse(data);
    // Check it the message is matching the conditions we passed to it

    if (
      parsedData &&
      parsedData.channel === channel &&
      type === parsedData.type &&
      (userId ? userId === parsedData.userId : true)
    ) {
      // Special handling for images: we decode them, save
      // as temporary files and pass the file path to Max

      if (parsedData.type === "IMAGE") {
        const image = parseDataUrl(parsedData.value);
        const filename = `${__dirname}/images/${parsedData.userId}.jpg`;
        fs.writeFileSync(filename, image.toBuffer());
        parsedData.value = filename;
      }

      // Pass the the websocket message to Max
      maxApi.outlet("message", parsedData);
    }
  });
});

maxApi.addHandler("publish", (channel, userId, userName, type, value) => {
  if (type === "IMAGE") {
    const encoding = "base64";
    const data = fs.readFileSync(`${__dirname}/${value}`).toString(encoding);
    const mimeType = "image/jpeg";
    const dataUrl = `data:${mimeType};${encoding},${data}`;
    value = dataUrl;
  }
  ws.send(
    createMessage({
      channel: channel,
      type: type,
      value: value,
      userId: userId,
      userName: userName,
    })
  );
});

// Helper function to create a websocket message

const createMessage = (message) => {
  const id = "abcdefghijklmnopqrstuvwxyz"
    .split("")
    .sort(() => Math.random() - 0.5)
    .slice(0, 16)
    .join("");
  return JSON.stringify({
    id,
    datetime: new Date().toISOString(),
    type: "",
    channel: "",
    userId: "",
    userName: "",
    value: "",
    ...message,
  });
};

const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return null;
  }
};
