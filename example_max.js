// Node system module

const fs = require("fs");

// Max module passed by Max Node environment

const maxApi = require("max-api");

// Modules installed with npm

const parseDataUrl = require("parse-data-url");
const Websocket = require("ws");

// Set up Websocket endpoint

const url = "wss://ws.elektron.art";

// Establish Websocket connection

const ws = new Websocket(url);

// Keep websocket connection alive

const interval = setInterval(() => ws.ping(() => {}), 15 * 1000);
interval.unref();

// Handle the "subscribe" message from Max

maxApi.addHandler("subscribe", (channel, type, userId = null) => {
  // Output the status from the first outlet of node.script object in Max

  maxApi.outlet("status", { status: "subscribed" });

  // Handle the incoming websocket message

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

      // Output the message from the second outlet of node.script object in Max
      maxApi.outlet("message", parsedData);
    }
  });
});

// Handle the "publish" message from Max

maxApi.addHandler(
  "publish",
  (channel, userId, userName, type, value, store = false) => {
    // Special handling for images: on "IMAGE" type we read the image path
    // passed from Max ("value"), read the file and encode it as DataURL

    if (type === "IMAGE") {
      const encoding = "base64";
      const data = fs.readFileSync(`${__dirname}/${value}`).toString(encoding);
      const mimeType = "image/jpeg";
      const dataUrl = `data:${mimeType};${encoding},${data}`;
      value = dataUrl;
    }

    // Send websocket message

    ws.send(
      createMessage({
        channel: channel,
        type: type,
        value: value,
        userId: userId,
        userName: userName,
        store: !!store,
      })
    );
  }
);

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

// Helper function to parse string and binaries into JSON

const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return null;
  }
};
