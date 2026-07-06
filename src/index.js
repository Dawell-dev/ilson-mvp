import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { applyFontScale } from './lib/fontScale';

// 저장된 글자 크기 설정을 렌더 전에 적용
applyFontScale();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
