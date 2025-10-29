import { useLocation, useNavigate } from "react-router-dom";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { getDailyMotion, getRandomMotions, type Motion } from "@/data/motions";
import { useState } from "react";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const motion: Motion = location.state?.motion;
  const stance: string | undefined = location.state?.stance;
  const scoreData = location.state?.results;
  const [motions, setMotions] = useState(() => {
    const daily = getDailyMotion();
    const random = getRandomMotions(2);
    return [daily, ...random];
  });

  // Redirect to home if no data
  if (!motion || !scoreData) {
    navigate("/");
    return null;
  }

  const handleTryAgain = () => {
    navigate("/recording", { 
      state: { motion, duration: 60, stance } 
    });
  };

  const handleNewTopic = () => {
    // Generate new random motions
    const daily = getDailyMotion();
    const random = getRandomMotions(2);
    setMotions([daily, ...random]);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-speech-bg p-4 py-8">
      <ScoreDisplay
        motion={motion}
        stance={stance}
        score={scoreData.score}
        feedback={scoreData.feedback}
        transcript={scoreData.transcript}
        missingPoints={scoreData.missingPoints}
        enhancedArgument={scoreData.enhancedArgument}
        enhancedFeedback={scoreData.enhancedFeedback}
        onTryAgain={handleTryAgain}
        onNewTopic={handleNewTopic}
      />
    </div>
  );
};

export default Results;

