
import { APIURL } from '../constants/contracts'
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client'
import ApolloLinkTimeout from 'apollo-link-timeout'

const FIELDS = `
  id
  name
  bioHash
  pictureHash
  bids
  bidsReceived
  sales
  bought
  totalSold
  totalBought
  isCreator
  biddingTotal
  sellingTotal
`


export async function getRankedCreatorsGraph(limit: number, from: number) {
  let total = 0
  let results = [] as any
  let creators = [] as any

  const creatorsQuery = `
    query {
      totals(id: "1") {
        creators
      }
      accounts(first: ${limit}, skip: ${from},
               where: {isCreator: true},
               orderBy: bidsReceived, orderDirection: desc) {
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
      query: gql(creatorsQuery),
    })
    .then((data) => {
      if (data) {
        results = data.data.accounts
        total = data.data.totals.creators
      }
    })
    .catch((err) => {
      console.warn('Error fetching data: ', err)
    })

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const creator = {
      ...result,
      address: result.id,
      bidsMade: result.bids,
      bids: result.bidsReceived,
      total: result.totalSold,
      totalBought: result.totalBought
    }

    creators.push(creator)
  }

  return [total, creators, results.length === 0]
}
