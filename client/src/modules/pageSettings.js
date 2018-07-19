import { UPDATE_PAGE_SETTINGS } from '../actions'

let initialPageSettings = {
  activeId: 0,
  showOverlay: false,
  showPopup: false,
  screenWidth: null,
  isLoading: false,
  showSnackbar: false,
  snackbarMessage: ''
}

const pageSettings = (state = initialPageSettings, action) => {
  switch (action.type) {
    case UPDATE_PAGE_SETTINGS:
      let payload = action.payload
      return Object.assign({}, state, payload)
    default:
      return state
  }
}

export default pageSettings
