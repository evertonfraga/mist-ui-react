import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Typography from '@material-ui/core/Typography'
import CloudDownloadIcon from '@material-ui/icons/CloudDownload'
import CheckBoxIcon from '@material-ui/icons/CheckBox'
import styled, { css } from 'styled-components'
import Spinner from '../../shared/Spinner'
import { without } from '../../../lib/utils'

export default class VersionListItem extends Component {
  static propTypes = {
    release: PropTypes.object,
    handleDownloadError: PropTypes.func,
    handleReleaseDownloaded: PropTypes.func
  }

  state = {
    isDownloading: false,
    downloadProgress: 0
  }

  isSelectedRelease = () => false

  releaseDisplayName = release => {
    const { fileName } = release
    const nameParts = fileName.split('-')
    const name = nameParts[0]
    const os = nameParts[1]
    let arch = nameParts[2]
    if (os === 'windows') {
      arch = arch === '386' ? '32 Bit' : '64 Bit'
    }
    const version = nameParts[3]
    // const channel = nameParts[4]
    const displayName = `${name} ${os} ${version} (${arch})`
    return displayName
  }

  downloadRelease = async release => {
    const { client, handleDownloadError, handleReleaseDownloaded } = this.props
    const { isDownloading } = this.state
    // Return if already downloading
    if (isDownloading) {
      return
    }
    this.setState({ isDownloading: true })
    try {
      console.log('download release')
      await client.download(release, downloadProgress => {
        console.log('download update', downloadProgress)
        this.setState({ downloadProgress })
      })
    } catch (error) {
      handleDownloadError(error)
    }
    this.setState({ isDownloading: false, downloadProgress: 0 })
    handleReleaseDownloaded(release)
  }

  handleReleaseSelected = release => {
    // const { dispatch } = this.props
    if (!release.remote) {
      // FIXME dispatch(setRelease({ release }))
    } else {
      this.downloadRelease(release)
    }
  }

  renderIcon = release => {
    const { downloadProgress, isDownloading } = this.state
    let icon = <BlankIconPlaceholder />
    if (isDownloading) {
      icon = (
        <Spinner variant="determinate" size={20} value={downloadProgress} />
      )
    } else if (release.remote) {
      icon = <CloudDownloadIcon color="primary" />
    } else if (this.isSelectedRelease(release)) {
      icon = <CheckBoxIcon color="primary" />
    } else if (!release.remote) {
      icon = <HiddenCheckBoxIcon color="primary" />
    }
    return icon
  }

  render() {
    const { release } = this.props
    const { downloadProgress, isDownloading } = this.state

    let actionLabel = 'Use'
    if (!release.remote) {
      actionLabel = 'Use'
      if (this.isSelectedRelease(release)) {
        actionLabel = 'Selected'
      }
    } else {
      actionLabel = 'Download'
      if (isDownloading) {
        actionLabel = 'Downloading'
      }
    }

    return (
      <StyledListItem
        button
        onClick={() => {
          this.handleReleaseSelected(release)
        }}
        selected={this.isSelectedRelease(release)}
        isDownloading={isDownloading}
        alt={release.name}
      >
        <ListItemIcon>{this.renderIcon(release)}</ListItemIcon>
        <ListItemTextVersion
          primary={this.releaseDisplayName(release)}
          isLocalRelease={!release.remote}
          secondary={downloadProgress > 0 ? `${downloadProgress}%` : null}
        />
        <StyledListItemAction>
          <Typography variant="button" color="primary">
            {actionLabel}
          </Typography>
        </StyledListItemAction>
      </StyledListItem>
    )
  }
}

const StyledListItemAction = styled.span`
  text-transform: uppercase;
`

const ListItemTextVersion = styled(({ isLocalRelease, children, ...rest }) => (
  <ListItemText
    {...rest}
    primaryTypographyProps={{
      style: { color: isLocalRelease ? 'black' : 'grey' }
    }}
  >
    {children}
  </ListItemText>
))`
  text-transform: capitalize;
  ${props =>
    props.isLocalRelease &&
    css`
      font-weight: bold;
      color: grey;
    `}
`

const HiddenCheckBoxIcon = styled(CheckBoxIcon)`
  visibility: hidden;
`

const BlankIconPlaceholder = styled.div`
  width: 24px;
  height: 24px;
`

const StyledListItem = styled(without('isDownloading')(ListItem))`
${props =>
  !props.selected &&
  css`
    ${StyledListItemAction} {
      visibility: hidden;
    }
  `}
  &:hover ${StyledListItemAction} {
    visibility: visible;
  }
  &:hover ${HiddenCheckBoxIcon} {
    visibility: visible;
  }
  ${props =>
    props.isDownloading &&
    css`
      ${StyledListItemAction} {
        visibility: visible;
      }
    `}
`
