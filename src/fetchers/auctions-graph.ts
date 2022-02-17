
import { BigNumber } from 'ethers'
import { APIURL } from '../constants/contracts'
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client'
import ApolloLinkTimeout from 'apollo-link-timeout'

const FIELDS = `
  id
  contract
  tokenId
  owner
  duration
  reservePrice
  houseId
  fee
  approved
  firstBidTime
  amount
  bidder
  created
  bids
`


export async function getActiveHouseAuctionsGraph(houseId: number, limit: number, from: number) {
  let total = 0
  let results = [] as any
  let auctions = [] as any

  const auctionQuery = `
    query {
      houses(where: {id: "${houseId}"}) {
        activeAuctions
        auctions(
          first: ${limit}, skip: ${from},
          orderBy: intId, orderDirection: desc) {
          ${FIELDS}
        }
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
      query: gql(auctionQuery),
    })
    .then((data) => {
      if (data) {
        results = data.data.houses[0].auctions
        total = data.data.houses[0].activeAuctions
      }
    })
    .catch((err) => {
      console.warn('Error fetching data: ', err)
    })

  for (let i = 0; i < results.length; i++) {
    if (results[i].id === '0')
      break

    const auction = {
      ...results[i],
      reservePrice: BigNumber.from(results[i].reservePrice),
      firstBidTime: BigNumber.from(results[i].firstBidTime),
      duration: BigNumber.from(results[i].duration),
      created: BigNumber.from(results[i].created),
      amount: BigNumber.from(results[i].amount),
      tokenContract: results[i].contract,
      tokenOwner: results[i].owner
    }

    auctions.push(auction)
  }

  return [total, auctions, results.length === 0]
}


export async function getActiveAuctionsGraph(limit: number, from: number, running = false) {
  let total = 0
  let results = [] as any
  let auctions = [] as any

  const auctionQuery = `
    query {
      totals(id: "1") {
        auctions
        active(first: ${limit}, skip: ${from},
               orderBy: ${running ? 'bids' : 'intId'}, orderDirection: desc) {
          ${FIELDS}
        }
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
      query: gql(auctionQuery),
    })
    .then((data) => {
      if (data) {
        results = data.data.totals.active
        total = data.data.totals.auctions
      }
    })
    .catch((err) => {
      console.warn('Error fetching data: ', err)
    })

  for (let i = 0; i < results.length; i++) {
    if (results[i].id === '0')
      break

    const auction = {
      ...results[i],
      reservePrice: BigNumber.from(results[i].reservePrice),
      firstBidTime: BigNumber.from(results[i].firstBidTime),
      duration: BigNumber.from(results[i].duration),
      created: BigNumber.from(results[i].created),
      amount: BigNumber.from(results[i].amount),
      tokenContract: results[i].contract,
      tokenOwner: results[i].owner
    }

    auctions.push(auction)
  }

  return [total, auctions, results.length === 0]
}


export async function getTopAuctionsGraph(limit: number, from: number) {
  let total = 0
  let results = [] as any
  let auctions = [] as any

  const auctionQuery = `
    query {
      totals(id: "1") {
        creators
      }
      accounts(first: ${limit}, skip: ${from},
               where: {sellingTotal_gt: 0},
               orderBy: bidsReceived, orderDirection: desc) {
        id
        sellingTotal
        selling(first: 1, orderBy: intId, orderDirection: desc) {
          ${FIELDS}
        }
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
      query: gql(auctionQuery),
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
    const result = results[i]['selling'][0]

    const auction = {
      ...result,
      reservePrice: BigNumber.from(result.reservePrice),
      firstBidTime: BigNumber.from(result.firstBidTime),
      duration: BigNumber.from(result.duration),
      created: BigNumber.from(result.created),
      amount: BigNumber.from(result.amount),
      tokenContract: result.contract,
      tokenOwner: result.owner
    }

    auctions.push(auction)
  }

  return [total, auctions, results.length === 0]
}
