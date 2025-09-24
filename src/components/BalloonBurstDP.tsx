import React, { useEffect, useRef, useState } from "react";
import "./BalloonBurstGame.css";

interface BalloonData {
  id: number;
  value: number;
  burst: boolean;
}

interface StepData {
  balloonId: number;
  balloonValue: number;
  leftVal: number;
  rightVal: number;
  cumulativeScore: number;
}

interface BalloonProps {
  id: number;
  value: number;
  burst: boolean;
  onBurst: (id: number) => void;
  hint?: boolean;
}





const Balloon: React.FC<BalloonProps> = ({ id, value, burst, onBurst, hint }) => (
  <div
    className={`balloon ${burst ? "burst" : ""} ${hint ? "hint" : ""}`}
    onClick={() => onBurst(id)}        // desktop click
    onTouchStart={() => onBurst(id)}   // mobile touch
  >
    <div className="balloon-value">{value}</div>

    {/* Needle */}
    {!burst && <div className="needle" />}

    {/* Balloon fragments falling down */}
    {burst &&
      Array.from({ length: 12 }).map((_, i) => {
        const dx = (Math.random() - 0.5) * 80;  // sideways
        const dy = Math.random() * 120 + 80;    // downward
        const rotate = Math.random() * 360;
        const size = Math.random() * 12 + 8;
        return (
          <div
            key={i}
            className="balloon-fragment"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              "--dx": `${dx}px`,
              "--dy": `${dy}px`,
              "--rotate": `${rotate}deg`,
            } as React.CSSProperties}
          />
        );
      })}
  </div>
);








const ProgressBar: React.FC<{ progress: number; currentScore: number; maxScore: number }> = ({ progress, currentScore, maxScore }) => {
  const safeProgress = Math.max(0, Math.min(1, progress || 0));
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${safeProgress * 100}%` }} />
      <div className="progress-text">{Math.round(currentScore)} / {Math.round(maxScore)} 🪙</div>
    </div>
  );
};

// --- Constants & Utilities ---
const BALLOON_COUNT = 6;

const generateUniqueBalloons = (count: number) => {
  const nums: number[] = [];
  while (nums.length < count) {
    const n = Math.floor(Math.random() * 9) + 1;
    if (!nums.includes(n)) nums.push(n);
  }
  return nums;
};

const calculateGain = (balloons: BalloonData[], idx: number) => {
  let leftVal = 1, rightVal = 1;
  for (let i = idx - 1; i >= 0; i--) if (!balloons[i].burst) { leftVal = balloons[i].value; break; }
  for (let i = idx + 1; i < balloons.length; i++) if (!balloons[i].burst) { rightVal = balloons[i].value; break; }
  const gain = balloons[idx].value * leftVal * rightVal;
  return { gain, leftVal, rightVal };
};

const burstBalloonsDP = (nums: number[]) => {
  const n = nums.length;
  const numsV = [1, ...nums, 1];
  const dp: number[][] = Array.from({ length: n + 2 }, () => Array(n + 2).fill(0));
  const last: number[][] = Array.from({ length: n + 2 }, () => Array(n + 2).fill(0));

  for (let len = 2; len <= n + 1; len++)
    for (let left = 0; left + len < n + 2; left++) {
      const right = left + len;
      for (let k = left + 1; k < right; k++) {
        const coins = dp[left][k] + dp[k][right] + numsV[left] * numsV[k] * numsV[right];
        if (coins > dp[left][right]) { dp[left][right] = coins; last[left][right] = k; }
      }
    }

  const getOrder = (left: number, right: number): number[] => {
    if (left + 1 >= right) return [];
    const k = last[left][right];
    return [...getOrder(left, k), ...getOrder(k, right), k - 1];
  };

  return { maxScore: dp[0][n + 1], order: getOrder(0, n + 1) };
};

const BalloonBurstDP: React.FC = () => {
  const [balloons, setBalloons] = useState<BalloonData[]>([]);
  const [history, setHistory] = useState<StepData[]>([]);
  const [currentScore, setCurrentScore] = useState(0);
  const currentScoreRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [originalNums, setOriginalNums] = useState<number[]>([]);
  const [optimalData, setOptimalData] = useState<{ maxScore: number; order: number[] }>({ maxScore: 0, order: [] });
  const [hintIdx, setHintIdx] = useState<number | null>(null);

  const initGame = () => {
    const values = generateUniqueBalloons(BALLOON_COUNT);
    setOriginalNums(values);
    const balloonObjs = values.map((v, i) => ({ id: i, value: v, burst: false }));
    setBalloons(balloonObjs);
    setHistory([]);
    setCurrentScore(0);
    currentScoreRef.current = 0;
    setProgress(0);

    const dpResult = burstBalloonsDP(values);
    setOptimalData(dpResult);
    setHintIdx(null);
  };

  useEffect(() => initGame(), []);

  const showHint = () => {
    const next = optimalData.order.find(idx => !balloons[idx].burst);
    setHintIdx(next ?? null);
  };

  const burstBalloon = (id: number) => {
    const index = balloons.findIndex(b => b.id === id);
    if (index === -1 || balloons[index].burst) return;

    const { gain, leftVal, rightVal } = calculateGain(balloons, index);
    const newCum = currentScoreRef.current + gain;

    const step: StepData = { 
      balloonId: id, 
      balloonValue: balloons[index].value, 
      leftVal, rightVal, 
      cumulativeScore: newCum 
    };

    const newBalloons = balloons.map((b, idx) => idx === index ? { ...b, burst: true } : b);
    setBalloons(newBalloons);
    setHistory(prev => [...prev, step]);
    setCurrentScore(newCum);
    currentScoreRef.current = newCum;
    setHintIdx(null);
  };

  const undo = () => {
    if (!history.length) return;
    const lastStep = history[history.length - 1];
    setBalloons(prev => prev.map(b => b.id === lastStep.balloonId ? { ...b, burst: false } : b));
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    const newScore = newHistory.length ? newHistory[newHistory.length - 1].cumulativeScore : 0;
    setCurrentScore(newScore);
    currentScoreRef.current = newScore;
    setHintIdx(null);
  };

  useEffect(() => setProgress(optimalData.maxScore ? Math.min(1, currentScore / optimalData.maxScore) : 0), [currentScore, optimalData.maxScore]);

  return (
    <div className="game-container">
      <div className="balloon-row">
        {balloons.map(b => (
          <Balloon key={b.id} {...b} onBurst={burstBalloon} hint={hintIdx === b.id} />
        ))}
      </div>
        <div className="ground" />


      <ProgressBar progress={progress} currentScore={currentScore} maxScore={optimalData.maxScore} />

      <div className="buttons">
        <button onClick={initGame}>New Question</button>
        <button onClick={undo}>Undo</button>
        <button onClick={showHint}>Show Hint</button>
      </div>
      
      <div className="history-log">
  {history.map((step, idx) => (
    <div key={idx} className="score-card">
      {idx === 0 && <div className="score-rules">Each burst = Right × Current × Left</div>}
      <div className="score-formula">
        {step.rightVal} × {step.balloonValue} × {step.leftVal} = {step.rightVal * step.balloonValue * step.leftVal} 🪙
      </div>
      <div className="score-cumulative">Total: {Math.round(step.cumulativeScore)} 🪙</div>
    </div>
  ))}
</div>



    </div>
  );
};

export default BalloonBurstDP;
