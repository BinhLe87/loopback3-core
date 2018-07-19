import React, { Fragment } from 'react'
import {blue500} from 'material-ui/styles/colors'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import CircularProgress from 'material-ui/CircularProgress'
import Snackbar from 'material-ui/Snackbar'
import LeftNavigation from '../LeftNavigation'

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: blue500,
  }
})

export default class Main extends React.Component {
  closeSnackbar = () => {
    this.props.updatePageSettings({
      showSnackbar: false,
      snackbarMessage: ''
    })
  }

  render() {
    let { isLoading, showSnackbar, snackbarMessage } = this.props.pageSettings

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <Fragment>
          <LeftNavigation {...this.props} />

          <main className="main-content">
            {this.props.children}
          </main>

          {isLoading &&
            <div className="loading">
              <CircularProgress className="loading-icon" size={80} thickness={5} />
            </div>
          }

          <Snackbar
            open={showSnackbar}
            className="snackbar"
            message={snackbarMessage}
            autoHideDuration={2500}
            onRequestClose={this.closeSnackbar}
          />
        </Fragment>
      </MuiThemeProvider>
    )
  }
}
