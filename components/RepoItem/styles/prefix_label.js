import styled from 'styled-components'

import PinSVG from '../../SvgIcons/PinSVG'
import { theme } from '../../../utils'

export const ReadedLabel = styled.div`
  color: ${theme('thread.articleDigest')};
  position: absolute;
  top: 22px;
  left: -16px;
  font-size: 0.9rem;
  opacity: 0.9;
  font-style: italic;
`
export const PinIcon = styled(PinSVG)`
  fill: ${theme('thread.articleDigest')};
  position: absolute;
  width: 22px;
  height: 22px;
  top: 22px;
  left: -16px;
`
