import React from "react";
import { Button } from "react-bootstrap";
import { FaMicrophone } from "react-icons/fa";

function VoiceInput({ onResult }) {
  const handleSpeech = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser does not support voice recognition.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      console.log("🎤 Voice recognition started...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("🎧 Recognized:", transcript);

      // Send the text to App.js
      onResult({ text: transcript });
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.start();
  };

  return (
    <Button variant="primary" onClick={handleSpeech}>
      <FaMicrophone className="me-2" />
      Speak Task
    </Button>
  );
}

export default VoiceInput;
