import { FC } from "react";

// Renders the title and subtitle for the quiz creation form
const QuizHeader: FC = () => {
  return (
    <div className="text-center mb-2">
      <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
        Create Your Quiz
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed">From Role to Quiz</p>
    </div>
  );
};

export default QuizHeader
