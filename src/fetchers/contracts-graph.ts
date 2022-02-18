
import { BigNumber } from 'ethers'
import { APIURL } from '../constants/contracts'
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client'
import ApolloLinkTimeout from 'apollo-link-timeout'

const FIELDS = `
  id
  name
  address
  bids
  sales
  total
  totalAuctions
`


export async function getRankedContractsGraph(limit: number, from: number, minimum?: number) {
  let total = 0
  let results = [] as any
  let contracts = [] as any

  const contractsQuery = `
    query {
      totals(id: "1") {
        contracts
      }
      contracts(first: ${limit}, skip: ${from},
                where: {totalAuctions_gte: ${minimum ? minimum : 1}},
                orderBy: lastUpdated, orderDirection: desc) {
        ${FIELDS}
        auctions(first: 4, orderBy: intId, orderDirection: desc) {
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
      query: gql(contractsQuery),
    })
    .then((data) => {
      if (data) {
        results = data.data.contracts
        total = data.data.totals.contracts
      }
    })
    .catch((err) => {
      console.warn('Error fetching data: ', err)
    })

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const tokens = result.auctions.map((auction: any) => {
      return {
        auction: {
          ...auction,
          reservePrice: BigNumber.from(auction.reservePrice),
          firstBidTime: BigNumber.from(auction.firstBidTime),
          duration: BigNumber.from(auction.duration),
          created: BigNumber.from(auction.created),
          amount: BigNumber.from(auction.amount),
          tokenContract: auction.contract,
          tokenOwner: auction.owner
        }
      }
    })
    const contract = {
      ...result,
      tokens: tokens,
      total: BigNumber.from(result.total),
      tokenContract: result.address
    }

    contracts.push(contract)
  }

  return [total, contracts, results.length === 0]
}

export async function getTokenContractGraph(address: string, first: number, offset: number) {
  let results = [] as any

  const contractQuery = `
    query {
      contracts(where: {id: "${address.toLowerCase()}"}) {
        ${FIELDS}
        auctions(first: ${first}, skip: ${offset}, orderBy: intId, orderDirection: desc) {
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
      query: gql(contractQuery),
    })
    .then((data) => {
      if (data)
        results = data.data.contracts
    })
    .catch((err) => {
      console.warn('Error fetching data: ', err)
    })

  if (results) {
    const result = results[0]
    const tokens = result.auctions.map((auction: any) => {
      return {
        auction: {
          ...auction,
          reservePrice: BigNumber.from(auction.reservePrice),
          firstBidTime: BigNumber.from(auction.firstBidTime),
          duration: BigNumber.from(auction.duration),
          created: BigNumber.from(auction.created),
          amount: BigNumber.from(auction.amount),
          tokenContract: auction.contract,
          tokenOwner: auction.owner
        }
      }
    })
    const contract = {
      ...result,
      tokens: tokens,
      tokenContract: result.address
    }
    return [contract, false]
  }
  return [null, true]
}
