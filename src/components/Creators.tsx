
import { useState, useEffect, useRef } from 'react'
import { useEthereum } from '../hooks/ethereum'
import { useWallet } from 'use-wallet'

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

import { getRankedCreators } from '../fetchers/creators'
import { getRankedCreatorsGraph } from '../fetchers/creators-graph'
import Address from '../components/Address'
import TokenAmount from 'token-amount'

import { ethers, Signer } from 'ethers'
import { Auctions } from '../abi/Auctions'
import { AUCTIONS } from '../constants/contracts'


export const Creators = (props: any) => {
  const { provider } = useEthereum()
  const { ethereum } = useWallet()

  const [ error, setError ] = useState('')
  const [ offset, setOffset ] = useState(0)
  const [ offsets, setOffsets ] = useState({ 0: ethers.constants.AddressZero} as any)
  const [ loaded, setLoaded ] = useState(false)
  const [ fetched, setFetched ] = useState(false)
  const [ creators, setCreators ] = useState([])
  const [ backDisabled, setBackDisabled ] = useState(true)
  const [ forwardDisabled, setForwardDisabled ] = useState(true)
  const [ graphAvailable, setGraphAvailable ] = useState(true)

  const mounted = useRef(true)
  const tableRef = useRef(null as any)


  const updateCreators = (creators: any, total: number) => {
    setCreators(creators)

    if (backDisabled && offset >= props.limit)
      setBackDisabled(false)
    else if (!backDisabled && offset <= props.limit)
      setBackDisabled(true)
    if (forwardDisabled && offset + props.limit < total)
      setForwardDisabled(false)
    else if (!forwardDisabled && offset + props.limit >= total)
      setForwardDisabled(true)

    setLoaded(true)
  }

  const handleUpdateRanking = (address: string) => {
    const updateRanking = async() => {
      const signer = new ethers.providers.Web3Provider(ethereum).getSigner()
      const contract = new ethers.Contract(AUCTIONS, Auctions, signer as Signer)

      await contract.updateCreatorRank(address).catch((e: any) => {
        console.warn(`In updateCreatorRank`, e.error ? e.error.message : e.message)
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
    setCreators([])
  }

  const handleForward = () => {
    setOffset((offset) => { return offset + props.limit })
    setForwardDisabled(true)
    setBackDisabled(true)
    setFetched(false)
    setLoaded(false)
    setCreators([])
  }

  useEffect(() => {
    const fetchCreators = async () => {
      if (fetched || !mounted.current)
        return
      setFetched(true)

      let total = 0
      let creators = []
      let timedOut = false

      if (graphAvailable)
        [total, creators, timedOut] = await getRankedCreatorsGraph(props.limit, offset)
      else
        [total, creators] = await getRankedCreators(provider, props.limit, offsets[offset])

      if (!mounted.current)
        return

      if (timedOut) {
        [total, creators] = await getRankedCreators(provider, props.limit, offsets[offset])
        setGraphAvailable(false)
      }

      if (!mounted.current)
        return

      if (!creators || creators.length === 0) {
        setLoaded(true)
        return
      }

      offsets[offset + props.limit] = creators[creators.length - 1].address
      setOffsets(offsets)

      updateCreators(creators, total)
    }
    fetchCreators()
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
          <h3 className='my-5'>Creators</h3>
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
              <th>Creator</th>
              <th className='text-center'>Bids</th>
              <th className='text-center'>Sales</th>
              <th className='text-end'>Sales total</th>
            </tr>
          </thead>
          <tbody ref={tableRef}>
          { creators.map((creator: any, idx: number) => {
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
                              handleUpdateRanking(creator.address)
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
                    <Address address={creator.address} />
                  </td>
                  <td className='text-center'>{creator.bids}</td>
                  <td className='text-center'>{creator.sales}</td>
                  <td className='text-end'>
                    {
                      TokenAmount.format(creator.total, 18, {
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
        { loaded && creators.length === 0 &&
          <Container fluid>
            <Alert variant='dark' className='text-center'>
              No creators could be found
            </Alert>
          </Container>
        }
      </Row>
    </>
  )
}
