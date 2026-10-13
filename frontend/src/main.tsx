import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth';
import './index.css';

const t = localStorage.getItem('theme');
if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></React.StrictMode>,
);
