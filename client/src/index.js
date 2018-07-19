import React from 'react'
import ReactDOM from 'react-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import reducer from './reducers'
import MainContainer from './Containers/MainContainer'
import PagePreviewContainer from './Containers/PagePreviewContainer'
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
          <Route exact path='/' component={PagePreviewContainer}/>
        </Switch>
      </MainContainer>
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
)
registerServiceWorker()
