// Thin re-export of the modular CreateQuizCard component
// Keeps existing import paths intact: import CreateQuizCard from "@/components/CreateQuizCard";
// Import directly from the Container to avoid circular aliasing through the directory index
import CreateQuizCard from "./CreateQuizCard/index";
export default CreateQuizCard;
