import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Khởi tạo gốc React Virtual DOM tại thẻ <div id="root"> và render giao diện
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Quản lý định tuyến trang phía Client không cần reload trình duyệt */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
