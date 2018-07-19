import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/lumen/bootstrap.min.css';
import './css/App.css';

import App from './App';
import React from 'react';
import { render } from 'react-static-generator';
import registerServiceWorker from './registerServiceWorker';

render(<App />, document.getElementById('root'));
registerServiceWorker();
