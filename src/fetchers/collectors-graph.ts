
// import { BigNumber } from 'ethers'
import { APIURL } from '../constants/contracts'
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client'
import ApolloLinkTimeout from 'apollo-link-timeout'

const FIELDS = `
  id
  bids
  sales
  bought
  totalSold
  totalBought
`


export async function getRankedCollectorsGraph(limit: number, from: number) {
  let total = 0
  let results = [] as any
  let collectors = [] as any

  const collectorsQuery = `
    query {
      totals(id: "1") {
        collectors
      }
      accounts(first: ${limit}, skip: ${from},
               where: {bids_gt: 0},
               orderBy: bids, orderDirection: desc) {
        ${FIELDS}
      }
    }
  `

  const timeoutLink = new ApolloLinkTimeout(3000)
  const httpLink = new HttpLink({ uri: APIURL })
  const timeoutHttpLink = timeoutLink.concat(httpLink)

  const client = new ApolloClient({
    link: timeoutHttpLink,
    cache: new InMemoryCache(),
  })

  await client
    .query({
      query: gql(collectorsQuery),
    })
    .then((data) => {
      // console.log('Subgraph data: ', data.data)
      if (data) {
        results = data.data.accounts
        total = data.data.totals.collectors
      }
    })
    .catch((err) => {
      console.warn('Error fetching data: ', err)
    })

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const collector = {
      ...result,
      address: result.id,
      totalSold: result.totalSold,
      totalSpent: result.totalBought
    }

    collectors.push(collector)
  }

  return [total, collectors, results.length === 0]
}
