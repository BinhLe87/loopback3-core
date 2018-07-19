import { connect } from 'react-redux'
import { updatePageSettings } from '../actions'
import { withRouter } from 'react-router-dom'
import Main from '../Components/Main';

const mapStateToProps = (state) => ({
  pageSettings: state.pageSettings
})

const mapDispatchToProps = {
  updatePageSettings: updatePageSettings
}

const MainContainer = withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(Main))

export default MainContainer
