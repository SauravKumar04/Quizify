import { useParams } from 'react-router-dom';
import QuizPlayer from '../components/quiz/QuizPlayer';

const QuizPage = () => {
  const { quizId } = useParams();

  return <QuizPlayer quizId={quizId} />;
};

export default QuizPage;
