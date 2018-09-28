import gql from 'graphql-tag'

const simpleMutation = gql`
  mutation($id: ID!) {
    post(id: $id) {
      id
    }
  }
`
const simpleQuery = `
  query ($owner: String!, $name: String!){
    repository(owner: $owner, name: $name) {
      name
      description
      url
      licenseInfo {
        key
      }
      object(expression: "master:README.md") {
        ... on Blob {
         text
        }
      }
      forkCount
      stargazers {
        totalCount
      }
      watchers {
        totalCount
      }
      issues(states: OPEN) {
        totalCount
      }
      pullRequests(states: OPEN) {
        totalCount
      }
      homepageUrl
      owner {
        login
        url
      }
      primaryLanguage {
        name
        color
      }
      releases(last: 1) {
        nodes {
          name
          tag {
            name
          }
        }
      }
    }
  }
`

const schema = {
  simpleMutation,
  simpleQuery,
}

export default schema
