import React from 'react';

function Loading({ text = '로딩 중...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-lg text-gray-600">{text}</p>
    </div>
  );
}

export default Loading;
