
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
// import { useHistory, useParams } from 'react-router-dom'

import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import TokenContract from '../components/TokenContract'
import { CreateCollectionModal } from '../components/modals/CreateCollectionModal'

import { getRankedContracts } from '../fetchers/contracts'
import { getRankedContractsGraph } from '../fetchers/contracts-graph'
import { ethers } from 'ethers'


export default function Collections(props: any) {
  const { provider } = useEthereum()
  // const history = useHistory()
  // const params = useParams<any>()

  const [ offset, setOffset ] = useState(0) // params.offset ? parseInt(params.offset, 10): 0)
  const [ offsets, setOffsets ] = useState({ 0: ethers.constants.AddressZero} as any)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ contracts, setContracts ] = useState([])
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
  const [ showCreateCollection, setShowCreateCollection ] = useState(false)
  const [ graphAvailable, setGraphAvailable ] = useState(true)

  const handleShowCreateCollection = () => setShowCreateCollection(true)
  const handleCloseCreateCollection = () => setShowCreateCollection(false)

  const mounted = useRef(true)

  const updateContracts = (contracts: any, total: number) => {
    if (!mounted.current)
      return

    setContracts(contracts)

    if (backDisabled && offset >= props.limit)
      setBackDisabled(false)
    else if (!backDisabled && offset < props.limit)
      setBackDisabled(true)
    if (forwardDisabled && offset + props.limit < total)
      setForwardDisabled(false)
    else if (!forwardDisabled && offset + props.limit >= total)
      setForwardDisabled(true)

    setLoaded(true)
  }

  const handleBack = () => {
    setOffset((offset) => { return offset - props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setContracts([])
    // history.push(`/collections/${offset - props.limit}`)
  }

  const handleForward = () => {
    setOffset((offset) => { return offset + props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setContracts([])
    // history.push(`/collections/${offset + props.limit}`)
  }

  useEffect(() => {
    const fetchContracts = async () => {
      if (fetched || !mounted.current)
        return
      setFetched(true)

      let total = 0
      let collections = []
      let timedOut = false

      if (graphAvailable)
        [total, collections, timedOut] = await getRankedContractsGraph(props.limit, offset)
      else
        [total, collections] = await getRankedContracts(provider, props.limit, offsets[offset])

      if (!mounted.current)
        return

      if (timedOut) {
        [total, collections] = await getRankedContracts(provider, props.limit, offsets[offset])
        setGraphAvailable(false)
      }

      if (!mounted.current)
        return

      if (!collections || collections.length === 0) {
        setLoaded(true)
        return
      }

      offsets[offset + props.limit] = collections[collections.length - 1].tokenContract
      setOffsets(offsets)

      updateContracts(collections, total)
    }
    fetchContracts()
  })

  // useEffect(() => {
  //   if (!mounted.current)
  //     return
  //
  //   const paramsOffset = params.offset ? parseInt(params.offset, 10) : 0
  //
  //   if (paramsOffset === offset)
  //     return
  //
  //   setContracts([])
  //   setOffset(paramsOffset)
  //   setForwardDisabled(true)
  //   setBackDisabled(true)
  //   setFetched(false)
  // }, [params.offset, offset])

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <Container fluid>
      <Row>
        <Col xs={5} md={6}>
          <h3 className='my-5'>Collections</h3>
        </Col>
        <Col xs={7} md={6} className='text-end'>
          <Button onClick={handleShowCreateCollection} className='header-button'>
            Create a collection
          </Button>
        </Col>
      </Row>
      <Container fluid className='mb-2'>
        <Row xs={1}>
          <Card.Header>
            <Row xs={1}>
              <Col xs={8} className='vertical-align'>
                All collections
              </Col>
              <Col xs={4} className='text-end'>
                <ButtonGroup>
                  <Button
                    size='sm'
                    onClick={handleBack}
                    disabled={backDisabled}>{'←'}</Button>
                  <Button
                    size='sm'
                    onClick={handleForward}
                    disabled={forwardDisabled}>{'→'}</Button>
                </ButtonGroup>
              </Col>
            </Row>
          </Card.Header>
        </Row>
      </Container>
      { contracts && contracts.length > 0 &&
        contracts.map((contract: any, index: number) => {
          return (
            <Row xs={1} key={`contract-${index}`} className='mb-3'>
              { provider ?
                <TokenContract
                  limit={4}
                  contract={contract} /> :
                <Alert variant='dark' className='text-center'>
                  <Spinner animation='grow' role='status' />
                </Alert>
              }
            </Row>
          )
        })
      }
      { (!loaded || !fetched) &&
        <Alert variant='dark' className='text-center'>
          <Spinner animation='grow' role='status' />
        </Alert>
      }
      { fetched && loaded && contracts.length === 0 &&
        <Alert variant='dark' className='text-center'>
          No token contracts could be found
        </Alert>
      }

      <CreateCollectionModal
        show={showCreateCollection}
        handleClose={handleCloseCreateCollection}
        setFetched={setFetched} />
    </Container>
  )
}
