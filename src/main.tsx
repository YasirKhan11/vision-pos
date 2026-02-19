import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// DevExpress Styles
import 'devextreme/dist/css/dx.light.css';
import config from 'devextreme/core/config';

// REGISTER DEVEXTREME LICENSE
// 1. Log in to DevExpress.com
// 2. Go to 'My Downloads'
// 3. Find 'DevExtreme Subscription' and copy your key
config({
  licenseKey: "ewogICJmb3JtYXQiOiAxLAogICJjdXN0b21lcklkIjogIjg0YWIwZWM2LWEyMjItNGYzMS04MmQzLWJjNTVlNThiNTlmMCIsCiAgIm1heFZlcnNpb25BbGxvd2VkIjogMjUyCn0=.l/TKhr4UV1XjoHpKf3Ngp5t4/5GJqEAWnAvO4eygtlrqyqsqPddsSDgKAGUkSKNtfTRC7x6qXw2EpFQHl/QKRdAbcmR9Ey/r7Qev4QbyL2Opefpsa7gAP9WZXP2XXxf8KrC24Q=="
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
