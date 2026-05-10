const video = document.getElementById("video");

// start camera
document.getElementById("startBtn").onclick = () => {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => console.log(err));
};

// capture
document.getElementById("captureBtn").onclick = () => {
  const name = document.getElementById("name").value;

  if (!name) {
    alert("Enter your name first");
    return;
  }

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  //  FIX: proper size use
  ctx.drawImage(video, 0, 0, 300, 200);

  //  FIX: better quality
  const image = canvas.toDataURL("image/jpeg", 0.8);

  console.log("Captured");

  fetch("http://localhost:3000/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image, name }),
  })
  .then(res => res.json())
  .then(data => {
    console.log("Server Response:", data);

    const resultBox = document.getElementById("result");

    if (data.type === "signup") {
      resultBox.innerHTML = `✅ Account created <br> Hello ${data.name} 🎉`;
    } 
    else if (data.type === "login") {
      resultBox.innerHTML = `👋 Welcome back, ${data.name}`;
    } 
    else {
      resultBox.innerHTML = `❌ ${data.message || "No face detected"}`;
    }

  })
  .catch(err => {
    console.log("ERROR:", err);
  });
};