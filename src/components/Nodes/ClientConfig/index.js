import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
// import { connect } from 'react-redux'
import AppBar from '@material-ui/core/AppBar'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Typography from '@material-ui/core/Typography'
import VersionList from './VersionList'
import ConfigForm from './ConfigForm'
import Terminal from '../Terminal'
import NodeInfo from '../NodeInfo'
import { clearError } from '../../../store/client/actions'
import Notification from '../../shared/Notification'

function TabContainer(props) {
  const { children, style } = props
  return (
    <Typography component="div" style={{ padding: '0 10px', ...style }}>
      {children}
    </Typography>
  )
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object
}

class ClientConfig extends Component {
  static propTypes = {
    client: PropTypes.object
  }

  state = {
    activeTab: 0,
    downloadError: null
  }

  static propTypes = {
    client: PropTypes.object,
    dispatch: PropTypes.func
  }

  constructor(props) {
    super(props)
    // geth.on('started', this.handleGethStarted)
  }

  componentWillUnmount() {
    // geth.removeListener('started', this.handleGethStarted)
  }

  handleTabChange = (event, activeTab) => {
    this.setState({ activeTab })
  }

  handleGethStarted = () => {
    // Update activeTab to Terminal
    this.setState({ activeTab: 2 })
  }

  onDismissError = () => {
    const { dispatch } = this.props
    dispatch(clearError())
  }

  renderErrors() {
    const { downloadError } = this.state
    const { client } = this.props
    const { error } = client

    const errorMessage = (error && error.toString()) || downloadError

    if (!errorMessage) {
      return null
    }

    return (
      <Notification
        type="error"
        message={errorMessage}
        onDismiss={this.onDismissError}
      />
    )
  }

  render() {
    const { client } = this.props
    const { activeTab } = this.state
    const { state, displayName: clientName } = client || {}
    return (
      <StyledMain>
        <Typography variant="h5">{clientName}</Typography>
        <NodeInfo />
        <Typography variant="subtitle1" gutterBottom>
          <StyledState>{state}</StyledState>
        </Typography>
        {this.renderErrors()}
        <StyledAppBar position="static">
          <Tabs
            value={activeTab}
            onChange={this.handleTabChange}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Version" />
            <Tab label="Settings" />
            <Tab
              label="Terminal"
              disabled={client && !client.getLogs().length}
            />
          </Tabs>
        </StyledAppBar>
        <TabContainer style={{ display: activeTab === 0 ? 'block' : 'none' }}>
          <div>
            <VersionList client={client} />
          </div>
        </TabContainer>
        <TabContainer style={{ display: activeTab === 2 ? 'block' : 'none' }}>
          <Terminal client={client} />
        </TabContainer>
        {activeTab === 1 && (
          <TabContainer>
            <ConfigForm />
          </TabContainer>
        )}
      </StyledMain>
    )
  }
}

/*
function mapStateToProps(state) {
  return {
    client: state.client
  }
}
*/

// export default connect(mapStateToProps)(ClientConfig)
export default ClientConfig

const StyledMain = styled.main`
  position: relative;
  min-width: 500px;
`

const StyledAppBar = styled(AppBar)`
  margin: 20px 0;
`

const StyledState = styled.div`
  color: rgba(0, 0, 0, 0.25);
  font-size: 13px;
  font-weight: bold;
`
