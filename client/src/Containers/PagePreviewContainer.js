import { connect } from 'react-redux'
import { updatePageSettings } from '../actions'
import PagePreview from '../Components/PagePreview'

const mapStateToProps = (state) => ({
  pageSettings: state.pageSettings
})

const mapDispatchToProps = {
  updatePageSettings: updatePageSettings
}

const PagePreviewContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(PagePreview)

export default PagePreviewContainer
