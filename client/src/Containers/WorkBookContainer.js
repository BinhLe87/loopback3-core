import { connect } from 'react-redux'
import { updatePageSettings } from '../actions'
import WorkBook from '../Components/WorkBook'

const mapStateToProps = (state) => ({
  pageSettings: state.pageSettings
})

const mapDispatchToProps = {
  updatePageSettings: updatePageSettings
}

const WorkBookContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkBook)

export default WorkBookContainer
