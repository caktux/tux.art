
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useWallet } from 'use-wallet'

import { Link } from 'react-router-dom'

import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Popover from 'react-bootstrap/Popover'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Table from 'react-bootstrap/Table'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { getRankedContracts } from '../fetchers/contracts'
import TokenAmount from 'token-amount'

import { ethers, Signer } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'


export const Collections = (props: any) => {
  const { provider } = useEthereum()
  const { ethereum } = useWallet()

  const [ error, setError ] = useState('')
  const [ offset, setOffset ] = useState(0)
  const [ offsets, setOffsets ] = useState({ 0: ethers.constants.AddressZero} as any)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ collections, setCollections ] = useState([])
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)

  const mounted = useRef(true)
  const tableRef = useRef(null as any)


  const updateCollections = (collections: any, total: number) => {
    if (!mounted.current)
      return

    setCollections(collections)

    if (backDisabled && offset >= props.limit)
      setBackDisabled(false)
    else if (!backDisabled && offset <= props.limit)
      setBackDisabled(true)
    if (forwardDisabled && collections.length < total)
      setForwardDisabled(true)
    else if (!forwardDisabled && collections.length >= total)
      setForwardDisabled(false)

    setLoaded(true)
  }

  const handleUpdateRanking = (address: string) => {
    const updateRanking = async() => {
      const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
      const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

      await contract.updateContractRank(address).catch((e: any) => {
        console.warn(`In updateContractRank`, e.error ? e.error.message : e.message)
        if (e.error && e.error.message)
          setError(e.error.message.replace('execution reverted: ', ''))
        else
          setError(e.message)
        return
      })
      setLoaded(false)
      setFetched(false)
    }
    updateRanking()
  }

  const handleBack = () => {
    setOffset((offset) => { return offset - props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setCollections([])
  }

  const handleForward = () => {
    setOffset((offset) => { return offset + props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setCollections([])
  }

  useEffect(() => {
    const fetchCollections = async () => {
      if (fetched || !mounted.current)
        return
      setFetched(true)

      const [total, collections] = await getRankedContracts(provider, props.limit, offsets[offset])

      if (!mounted.current)
        return

      if (!collections || collections.length === 0) {
        setLoaded(true)
        return
      }

      offsets[offset + props.limit] = collections[collections.length - 1].tokenContract
      setOffsets(offsets)

      updateCollections(collections, total)
    }
    fetchCollections()
  })

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <>
      <Row>
        <Col>
          <h3 className='my-5'>Collections</h3>
        </Col>
      </Row>
      { error &&
        <Alert variant='danger' onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      }
      <Row>
        <Container fluid className='mb-3'>
          <Card.Header>
            <Row xs={1}>
              <Col className='text-end'>
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
        </Container>

        <Table responsive striped hover>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Collection</th>
              <th className='text-center'>Bids</th>
              <th className='text-center'>Sales</th>
              <th className='text-end'>Sales total</th>
            </tr>
          </thead>
          <tbody ref={tableRef}>
          { collections && collections.length > 0 &&
            collections.map((collection: any, idx: number) => {
              return (
                <tr key={idx}>
                  <td>
                    <OverlayTrigger
                      placement='right'
                      trigger='click'
                      rootClose
                      delay={{ show: 250, hide: 400 }}
                      overlay={
                        <Popover>
                          <Popover.Body>
                            <Button size='sm' onClick={() => {
                              tableRef.current.click()
                              handleUpdateRanking(collection.tokenContract)
                            }}>
                              Update ranking
                            </Button>
                          </Popover.Body>
                        </Popover>
                      }>
                      {({ ref, ...triggerHandler }) => (
                        <Button size='sm' variant='secondary' ref={ref} {...triggerHandler} className='wr-3'>
                          #{offset + idx + 1}
                        </Button>
                      )}
                    </OverlayTrigger>
                  </td>
                  <td>
                    <Link to={ `/contract/${collection.tokenContract}` }>
                      {collection.name}
                    </Link>
                  </td>
                  <td className='text-center'>{collection.bids.toNumber()}</td>
                  <td className='text-center'>{collection.sales.toNumber()}</td>
                  <td className='text-end'>
                    {
                      TokenAmount.format(collection.total, 18, {
                        symbol: 'Ξ',
                        digits: 5,
                        commify: true
                      })
                    }
                  </td>
                </tr>
              )
            })
          }
          </tbody>
        </Table>
        { !loaded &&
          <Container fluid>
            <Alert variant='dark' className='text-center'>
              <Spinner animation='grow' role='status' />
            </Alert>
          </Container>
        }
        { loaded && collections.length === 0 &&
          <Container fluid>
            <Alert variant='dark' className='text-center'>
              No collections could be found
            </Alert>
          </Container>
        }
      </Row>
    </>
  )
}
