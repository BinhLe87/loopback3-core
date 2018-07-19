import React from 'react'
import ReactDOM from 'react-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import reducer from './reducers'
import MainContainer from './Containers/MainContainer'
import WorkBookContainer from './Containers/WorkBookContainer'
import Overview from './Components/Overview'
import Automation from './Components/Automation'
import Analytics from './Components/Analytics'
import './assets/style/style.css'
import injectTapEventPlugin from 'react-tap-event-plugin'
import registerServiceWorker from './registerServiceWorker'

injectTapEventPlugin();

const store = createStore(
  reducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <MainContainer>
        <Switch>
          <Route exact path='/' component={Overview}/>
          <Route path='/workbook' component={WorkBookContainer}/>
          <Route path='/automation' component={Automation}/>
          <Route path='/analytics' component={Analytics}/>
        </Switch>
      </MainContainer>
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
)
registerServiceWorker()
