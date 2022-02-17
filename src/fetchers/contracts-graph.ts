
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
                where: {totalAuctions_gte: ${minimum ? minimum : 0}},
                orderBy: lastUpdated, orderDirection: desc) {
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
      query: gql(contractsQuery),
    })
    .then((data) => {
      // console.log('Subgraph data: ', data.data)
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
    const contract = {
      ...result,
      total: BigNumber.from(result.total),
      tokenContract: result.address
    }

    contracts.push(contract)
  }

  return [total, contracts, results.length === 0]
}
