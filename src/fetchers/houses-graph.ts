
import { BigNumber } from 'ethers'
import { APIURL } from '../constants/contracts'
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client'
import ApolloLinkTimeout from 'apollo-link-timeout'


const FIELDS = `
  id
  name
  curator
  fee
  preApproved
  bids
  sales
  total
  feesTotal
  activeAuctions
  creators {
    id
  }
`


export async function getActiveHousesGraph(limit: number, from: number, minimum?: number) {
  let total = 0
  let results = [] as any
  let houses = [] as any

  const houseQuery = `
    query {
      houses(first: ${limit}, skip: ${from},
             where: {activeAuctions_gt: ${minimum ? minimum - 1 : 0}},
             orderBy: lastUpdated, orderDirection: desc) {
        ${FIELDS}
      }
      totals(id: "1") {
        houses
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
      query: gql(houseQuery),
    })
    .then((data) => {
      if (data) {
        results = data.data.houses
        total = data.data.totals.houses
      }
      // console.log('Subgraph data: ', data)
    })
    .catch((err) => {
      console.warn('Error fetching data: ', err)
    })

  for (let i = 0; i < results.length; i++) {
    if (results[i].id === '0')
      break

    const house = {
      ...results[i],
      fee: results[i].fee / 100,
      activeAuctions: BigNumber.from(results[i].activeAuctions)
    }

    houses.push(house)
  }

  return [total, houses, results.length === 0]
}


export async function getRankedHousesGraph(limit: number, from: number, minimum?: number, getCreators?: boolean) {
  let total = 0
  let results = [] as any
  let houses = [] as any

  const houseQuery = `
    query {
      houses(first: ${limit}, skip: ${from},
             where: {activeAuctions_gt: ${minimum ? minimum - 1 : 0}},
             orderBy: bids, orderDirection: desc) {
        ${FIELDS}
      }
      totals(id: "1") {
        houses
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
      query: gql(houseQuery),
    })
    .then((data) => {
      if (data) {
        results = data.data.houses
        total = data.data.totals.houses
      }
      // console.log('Subgraph data: ', data)
    })
    .catch((err) => {
      console.warn('Error fetching data: ', err)
    })

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.id === '0')
      break

    let creators = []
    for (let c = 0; c < result.creators.length; c++) {
      creators.push({ address: result.creators[c].id })
    }

    const house = {
      ...result,
      creators: creators,
      fee: result.fee / 100
    }

    houses.push(house)
  }

  return [total, houses, results.length === 0]
}
