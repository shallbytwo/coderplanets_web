import React from 'react'
import { Provider } from 'mobx-react'

import initRootStore from '../stores/init'
import { GAWraper, ErrorPage } from '../components'

import {
  makeGQClient,
  getSubPath,
  getThirdPath,
  ROUTE,
  THREAD,
  BStore,
  ssrAmbulance,
} from '../utils'

import {
  ThemeWrapper,
  MultiLanguage,
  Preview,
  Doraemon,
  Route,
  BodyLayout,
  Header,
  ArticleBanner,
  VideoContent,
  Footer,
} from '../containers'

import { P } from '../containers/schemas'

// try to fix safari bug
// see https://github.com/yahoo/react-intl/issues/422
global.Intl = require('intl')

async function fetchData(props) {
  const token = BStore.cookie.from_req(props.req, 'jwtToken')
  const gqClient = makeGQClient(token)

  const videoId = getThirdPath(props)

  // query data
  const sessionState = gqClient.request(P.sessionState)
  const video = gqClient.request(P.video, { id: videoId })
  const subscribedCommunities = gqClient.request(P.subscribedCommunities, {
    filter: {
      page: 1,
      size: 30,
    },
  })

  return {
    ...(await sessionState),
    ...(await video),
    ...(await subscribedCommunities),
  }
}

export default class Index extends React.Component {
  static async getInitialProps(props) {
    let resp
    try {
      resp = await fetchData(props)
    } catch ({ response: { errors } }) {
      if (ssrAmbulance.hasLoginError(errors)) {
        resp = await fetchData(props, { realname: false })
      } else {
        return { statusCode: 404, target: getSubPath(props) }
      }
    }

    const { sessionState, video, subscribedCommunities } = resp

    return {
      langSetup: {},
      account: {
        user: sessionState.user || {},
        isValidSession: sessionState.isValid,
        userSubscribedCommunities: subscribedCommunities,
      },
      route: { mainPath: ROUTE.VIDEO, subPath: video.id },
      viewing: {
        video,
        activeThread: THREAD.VIDEO,
        community: video.communities[0],
      },
    }
  }

  constructor(props) {
    super(props)
    const store = props.statusCode
      ? initRootStore({ langSetup: {} })
      : initRootStore({ ...props })

    this.store = store
  }

  render() {
    const { statusCode, target } = this.props

    return (
      <Provider store={this.store}>
        <GAWraper>
          <ThemeWrapper>
            {statusCode ? (
              <ErrorPage errorCode={statusCode} page="video" target={target} />
            ) : (
              <React.Fragment>
                <Route />
                <MultiLanguage>
                  <Preview />
                  <Doraemon />
                  <BodyLayout noSidebar>
                    <Header />
                    <ArticleBanner />
                    <VideoContent />
                    <Footer />
                  </BodyLayout>
                </MultiLanguage>
              </React.Fragment>
            )}
          </ThemeWrapper>
        </GAWraper>
      </Provider>
    )
  }
}
