import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

// Renders the generation queue list with progress bars
export const GenerationQueue: FC<{
  items: { id: number; title: string; scheduled: string; status: string; progress: number }[];
}> = ({ items }) => {
  return (
    <Card className="bg-black border-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="bg-gray-200 p-2 rounded-lg">
            <Clock className="h-5 w-5 text-black" />
          </div>
          <span className="text-white">Generation Queue</span>
          <Badge
            variant="secondary"
            className="ml-auto bg-gray-200 text-black hover:bg-white hover:text-black transition-colors duration-300"
          >
            {items.length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((quiz) => (
            <Card
              key={quiz.id}
              className="group border-border bg-black cursor-pointer transform transition-all duration-300 hover:scale-105"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-lg">{quiz.title}</h4>
                    <div className="flex items-center space-x-3 mt-2">
                      <Badge
                        variant={quiz.status === "generating" ? "default" : "secondary"}
                        className={`${
                          quiz.status === "generating"
                            ? "bg-gray-200 text-black hover:bg-white hover:text-black"
                            : "bg-black text-gray-200 border-border hover:bg-white hover:text-black"
                        } transition-colors duration-300`}
                      >
                        {quiz.status}
                      </Badge>
                      {quiz.status === "generating" && (
                        <div className="flex items-center space-x-2">
                          <Progress value={quiz.progress} className="w-32 h-2 bg-gray-200" />
                          <span className="text-sm text-gray-200 font-medium">{quiz.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
