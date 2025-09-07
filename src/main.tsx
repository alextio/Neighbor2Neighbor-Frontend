import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { Provider } from 'react-redux';
import store from './store/store.ts';
import { ToastProvider } from './components/ui/toast.tsx';


createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <StrictMode>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StrictMode>
  </Provider>,
);
