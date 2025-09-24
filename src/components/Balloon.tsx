import React from "react";
import "./BalloonBurstGame.css";

interface BalloonProps {
  id: number;
  value: number;
  burst: boolean;
  onBurst: (id: number) => void;
}

const Balloon: React.FC<BalloonProps> = ({ id, value, burst, onBurst }) => {
  return (
    <div
      className={`balloon ${burst ? "burst" : ""}`}
      onClick={() => !burst && onBurst(id)}
    >
      {!burst && <span className="balloon-number">{value}</span>}
    </div>
  );
};

export default Balloon;
