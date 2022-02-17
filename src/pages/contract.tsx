
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useParams } from 'react-router-dom'

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'

import TokenContract from '../components/TokenContract'

import { getTokenContract } from '../fetchers/contracts'
import { getTokenContractGraph } from '../fetchers/contracts-graph'


export default function Contract(props: any) {
  const { provider } = useEthereum()
  const params = useParams<any>()

  const [ fetched, setFetched ] = useState(false)
  const [ contract, setContract ] = useState({name: '', tokenContract: '', auctions: []})
  const [ graphAvailable, setGraphAvailable ] = useState(true)

  const mounted = useRef(true)

  useEffect(() => {
    const fetchContract = async () => {
      if (fetched || !params.address)
        return
      setFetched(true)

      let contract = {} as any
      let timedOut = false

      if (graphAvailable)
        [contract, timedOut] = await getTokenContractGraph(params.address, props.limit, 0)
      else
        contract = await getTokenContract(provider, params.address)

      if (!mounted.current)
        return

      if (timedOut) {
        contract = await getTokenContract(provider, params.address)
        setGraphAvailable(false)
      }

      if (!mounted.current)
        return

      setContract(contract)
    }
    fetchContract()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <Container fluid>
      { params.address &&
        <Row xs={1} className='mb-3'>
          <TokenContract
            limit={props.limit}
            contract={contract} />
        </Row>
      }
    </Container>
  )
}
