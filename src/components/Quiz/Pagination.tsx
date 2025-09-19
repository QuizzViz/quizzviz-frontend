import { Button } from "@/components/ui/button";
import { QuizPaginationProps } from "./types";

export function Pagination({
  currentPage,
  totalPages,
  totalQuestions,
  questionsPerPage,
  onPageChange,
}: QuizPaginationProps) {
  return (
    <>
      {/* Desktop Pagination */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="text-sm text-gray-300">
          Showing{' '}
          <span className="font-medium">
            {Math.min((currentPage - 1) * questionsPerPage + 1, totalQuestions)}
          </span>{' '}
          to{' '}
          <span className="font-medium">
            {Math.min(currentPage * questionsPerPage, totalQuestions)}
          </span>{' '}
          of <span className="font-medium">{totalQuestions}</span> questions
        </div>
        
        <nav className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            // Show first, last, and pages around current page
            if (
              pageNum === 1 || 
              pageNum === totalPages || 
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) ||
              (currentPage <= 3 && pageNum <= 5) ||
              (currentPage >= totalPages - 2 && pageNum >= totalPages - 4)
            ) {
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
            
            // Show ellipsis
            if (
              (pageNum === 2 && currentPage > 3) ||
              (pageNum === totalPages - 1 && currentPage < totalPages - 2)
            ) {
              return (
                <span key={`ellipsis-${pageNum}`} className="px-2 py-2 text-gray-400">
                  ...
                </span>
              );
            }
            
            return null;
          })}
          
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </nav>
      </div>
      
      {/* Mobile Pagination */}
      <div className="sm:hidden flex items-center justify-between mt-4">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Previous
        </button>
        
        <span className="text-sm text-gray-300">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Next
        </button>
      </div>
    </>
  );
}
