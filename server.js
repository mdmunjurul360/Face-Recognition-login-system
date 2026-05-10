console.log("SERVER STARTED ");
require("dotenv").config();

const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(express.static("public"));

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

//  upload route
app.post("/upload", async (req, res) => {
  const { image, name } = req.body;

  console.log("📸 Image received");

  try {
    if (!image) {
      return res.json({ message: "No image" });
    }

    const base64 = image.split(",")[1];

    console.log("📡 Calling Face++ Detect API...");

    // 🔹 1️⃣ DETECT
    const detectRes = await fetch("https://api-us.faceplusplus.com/facepp/v3/detect", {
      method: "POST",
      body:   URLSearchParams({
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
        image_base64: base64
      })
    });

    const detectData = await detectRes.json();

    console.log(" Face++ Detect:", detectData);

    if (!detectData.faces || detectData.faces.length === 0) {
      return res.json({ message: "No face detected" });
    }

    const newToken = detectData.faces[0].face_token;

    //  READ USERS (SAFE)
    let users = [];

    if (fs.existsSync("users.json")) {
      try {
        const fileData = fs.readFileSync("users.json", "utf-8");
        users = fileData ? JSON.parse(fileData) : [];
      } catch {
        users = [];
      }
    }

    //   FACE COMPARE (MAIN SECURITY)
    for (let user of users) {
      const compareRes = await fetch("https://api-us.faceplusplus.com/facepp/v3/compare", {
        method: "POST",
        body: new URLSearchParams({
          api_key: process.env.API_KEY,
          api_secret: process.env.API_SECRET,
          face_token1: newToken,
          face_token2: user.token
        })
      });

      const compareData = await compareRes.json();

      console.log(` Compare with ${user.name}:`, compareData.confidence);

      //  threshold (IMPORTANT)
      if (compareData.confidence > 50) {
        return res.json({
          type: "login",
          name: user.name,
          message: `তোমার already account আছে: ${user.name}`
        });
      }
    }

    //  USERNAME CHECK
    if (users.find(u => u.name === name)) {
      return res.json({
        message: "Username already taken"
      });
    }

    //  SIGNUP
    users.push({ name, token: newToken });

    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

    return res.json({
      type: "signup",
      name: name
    });

  } catch (err) {
    console.log("❌ ERROR:", err);
    res.json({ message: "Server error" });
  }
});