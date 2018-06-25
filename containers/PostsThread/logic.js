import R from 'ramda'
import {
  asyncRes,
  asyncErr,
  later,
  makeDebugger,
  dispatchEvent,
  EVENT,
  ERR,
  TYPE,
  THREAD,
  $solver,
  scrollIntoEle,
  GA,
} from '../../utils'

import { PAGE_SIZE } from '../../config'
import S from './schema'
import SR71 from '../../utils/network/sr71'
// import sr71$ from '../../utils/network/sr71_simple'

const sr71$ = new SR71({
  resv_event: [
    EVENT.REFRESH_POSTS,
    EVENT.PREVIEW_CLOSED,
    EVENT.COMMUNITY_CHANGE,
  ],
})
/* eslint-disable no-unused-vars */
const debug = makeDebugger('L:PostsThread')
/* eslint-enable no-unused-vars */

let store = null
let sub$ = null

const validFilter = R.pickBy(
  R.compose(
    R.not,
    R.isEmpty
  )
)

export function inAnchor() {
  store.setHeaderFix(false)
}

export function outAnchor() {
  store.setHeaderFix(true)
}

export function loadPosts(page = 1) {
  /* const { community, activeThread } = store.curCommunity */
  const { mainPath } = store.curRoute
  const community = mainPath

  store.markState({ curView: TYPE.LOADING })

  const args = {
    /* first: 4, */
    filter: {
      page,
      size: PAGE_SIZE.COMMON,
      ...store.curFilter,
      tag: store.activeTagData.raw,
      community,
    },
  }

  args.filter = validFilter(args.filter)
  scrollIntoEle(TYPE.APP_HEADER_ID)

  store.markRoute({ page })
  debug('load posts --> ', args)
  sr71$.query(S.pagedPosts, args)
}

export function loadTags() {
  const community = store.curRoute.mainPath
  const thread = R.toUpper(THREAD.POST)

  const args = { community, thread }
  debug('loadTags --> ', args)
  sr71$.query(S.partialTags, args)
}

export function onFilterSelect(key, val) {
  store.selectFilter(key, val)
  loadPosts()
}

export function onTagSelect(tag) {
  store.selectTag(tag)
  loadPosts()
}

export function onTitleSelect(activePost) {
  store.markState({ activePost })
  /* store.setActive(post) */
  debug('onTitleSelect publish post: ', activePost)
  // dispatchEvent(EVENT.PREVIEW, { type: TYPE.POST_PREVIEW_VIEW, data: post })
  dispatchEvent(EVENT.NAV_EDIT, {
    type: TYPE.POST_PREVIEW_VIEW,
    data: activePost,
  })

  GA.event({
    action: activePost.title,
    category: '浏览',
    label: '社区',
  })
}

export function createContent() {
  debug('onTitleSelect createContent ')
  dispatchEvent(EVENT.NAV_CREATE_POST, { type: TYPE.PREVIEW_CREATE_POST })
}

const DataSolver = [
  {
    match: asyncRes('pagedPosts'),
    action: ({ pagedPosts }) => {
      let curView = TYPE.RESULT
      if (pagedPosts.entries.length === 0) {
        curView = TYPE.RESULT_EMPTY
      }
      store.markState({ curView, pagedPosts })
    },
  },
  {
    match: asyncRes('partialTags'),
    action: ({ partialTags }) => {
      store.markState({
        tags: partialTags,
      })
    },
  },
  {
    match: asyncRes(EVENT.COMMUNITY_CHANGE),
    action: () => {
      loadPosts()
      later(loadTags, 500)
    },
  },
  {
    match: asyncRes(EVENT.REFRESH_POSTS),
    action: res => {
      debug('EVENT.REFRESH_POSTS: ', res)
      loadPosts()
    },
  },
  {
    match: asyncRes(EVENT.PREVIEW_CLOSED),
    action: () => store.markState({ activePost: {} }),
  },
]

const ErrSolver = [
  {
    match: asyncErr(ERR.CRAPHQL),
    action: ({ details }) => {
      debug('ERR.CRAPHQL -->', details)
    },
  },
  {
    match: asyncErr(ERR.TIMEOUT),
    action: ({ details }) => {
      debug('ERR.TIMEOUT -->', details)
    },
  },
  {
    match: asyncErr(ERR.NETWORK),
    action: ({ details }) => {
      debug('ERR.NETWORK -->', details)
    },
  },
]

const loadIfNeed = () => {
  if (!store.pagedPosts) {
    loadPosts()
    later(loadTags, 300)
  }
}

export function init(_store) {
  if (store) return false
  store = _store

  if (sub$) sub$.unsubscribe()
  sub$ = sr71$.data().subscribe($solver(DataSolver, ErrSolver))
  loadIfNeed()
}
