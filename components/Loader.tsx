"use client";

export function Loader() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-900 dark:text-gray-100 text-lg font-medium">Processing your recording...</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
          This might take a few moments while we transcribe your audio
        </p>
      </div>
    </div>
  );
}
