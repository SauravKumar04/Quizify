const QuestionCard = ({ question, questionNumber, selectedOption, onSelectOption, showAnswer }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Question {questionNumber}: {question.questionText}
      </h3>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <label
            key={index}
            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${
              selectedOption === index
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name={`question-${question._id}`}
              checked={selectedOption === index}
              onChange={() => onSelectOption(index)}
              className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-3 text-gray-900">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
