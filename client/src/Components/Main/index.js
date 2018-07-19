import React, { Fragment } from 'react'
import {blue500} from 'material-ui/styles/colors'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import CircularProgress from 'material-ui/CircularProgress'
import Snackbar from 'material-ui/Snackbar'
import LeftContent from '../LeftContent'
import { classnames } from '../../utils'

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: blue500,
  }
})

export default class Main extends React.Component {
  handleResizeWindow = () => {
    let bodyWidth = document.body.clientWidth
    this.props.updatePageSettings({screenWidth: bodyWidth})

    if (bodyWidth < 768) {
      this.props.updatePageSettings({showCvsInfo: false})
    } else {
      this.setState({showCvsInfo: true})
      this.props.updatePageSettings({showCvsInfo: true})
    }

    if (bodyWidth < 1024) {
      document.body.classList.remove('showLeftNav')
      this.props.updatePageSettings({
        showLeftNav: false,
        showConversationsMenu: false
      })
    } else {
      document.body.classList.add('showLeftNav')
      this.props.updatePageSettings({
        showLeftNav: true
      })
    }
  }

  componentWillMount() {
    this.handleResizeWindow()
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResizeWindow)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResizeWindow)
  }

  componentDidUpdate() {
    let { showLeftNav, isLoading } = this.props.pageSettings
    if (isLoading) {
      document.body.classList.add('no-scroll')
    } else {
      document.body.classList.remove('no-scroll')
    }
    if (showLeftNav) {
      document.body.classList.add('showLeftNav')
    } else {
      document.body.classList.remove('showLeftNav')
    }
  }

  closeSnackbar = () => {
    this.props.updatePageSettings({
      showSnackbar: false,
      snackbarMessage: ''
    })
  }

  render() {
    let { showLeftNav, screenWidth, showPopup, isLoading, showSnackbar, snackbarMessage } = this.props.pageSettings

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <Fragment>
          <LeftContent {...this.props} />

          <main className={classnames("main-content", {showLeftNav: showLeftNav}, {showPopup: showPopup})}>
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
