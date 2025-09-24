import React from "react";
import "./BalloonBurstGame.css";

interface TestTubeProps {
  progress: number; // 0 to 1
}

const TestTube: React.FC<TestTubeProps> = ({ progress }) => (
  <div className="tube-container">
    <div className="progress" style={{ width: `${progress * 100}%` }}></div>
  </div>
);


export default TestTube;
