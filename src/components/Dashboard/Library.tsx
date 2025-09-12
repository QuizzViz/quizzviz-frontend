import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Star, FileText } from "lucide-react";

// Grid of previous quizzes with key stats
export const QuizLibrary: FC<{
  items: { id: number; title: string; questions: number; completed: number; rating: number; subject: string; difficulty: string }[];
}> = ({ items }) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-200">Your Quiz Library</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-200">
          <span>{items.length} quizzes</span>
          <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
          <span>Ready to deploy</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((quiz) => (
          <Card
            key={quiz.id}
            className="group bg-black hover:bg-black transition-all duration-500 ease-out transform hover:scale-105 cursor-pointer border-gray-200 hover:border-white hover:shadow-xl"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-200 group-hover:text-white line-clamp-2 transition-colors duration-300">
                {quiz.title}
              </CardTitle>
              <FileText className="h-4 w-4 text-gray-200 group-hover:text-white flex-shrink-0 transition-colors duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-200 group-hover:text-white transition-colors duration-300">
                {quiz.questions}
              </div>
              <div className="text-xs text-gray-200 group-hover:text-gray-200 transition-colors duration-300">
                Questions
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-200 group-hover:text-white mt-3 transition-colors duration-300">
                <Users className="h-3 w-3" />
                <span>{quiz.completed} completed</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-200 group-hover:text-white mt-1 transition-colors duration-300">
                <Star className="h-3 w-3" />
                <span>{quiz.rating}/5.0 rating</span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Badge variant="secondary" className="bg-gray-200 text-black group-hover:bg-white group-hover:text-black transition-colors duration-300">
                  {quiz.subject}
                </Badge>
                <Badge variant="outline" className="text-xs border-gray-200 text-gray-200 group-hover:border-white group-hover:text-white transition-all duration-300">
                  {quiz.difficulty}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
